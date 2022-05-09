import { SuggestionState, getSuggestions, getSuggestionPrintout, updateSuggestionState } from './suggestions';
import { TextChannel, MessageEmbed, VoiceChannel, Message } from 'discord.js';
import { CommandoClient } from 'discord.js-commando';
import { CronJob } from 'cron';
import { EMBED_COLOUR } from '../utils/embeds';

import { toTitleCase } from '../commands/bootcamp/utils';
import { BootcampSettings } from '../components/bootcamp';

import _ from 'lodash';

const MOD_CHANNEL_ID: string = process.env.MOD_CHANNEL_ID || '.';
const BOOTCAMP_GUILD_ID: string = process.env.BOOTCAMP_GUILD_ID || '.';

// Checks for new suggestions every min
export const createSuggestionCron = (client: CommandoClient): CronJob =>
  new CronJob('0 */1 * * * *', async function () {
    const createdSuggestions = await getSuggestions(SuggestionState.Created);
    const createdSuggestionIds = createdSuggestions.map((a) => Number(a.id));
    if (!_.isEmpty(createdSuggestionIds)) {
      const messageChannel = client.channels.cache.get(MOD_CHANNEL_ID);

      if (!messageChannel) {
        throw 'Bad channel ID';
      } else if (messageChannel.type === 'text') {
        // construct embed for display
        const output = await getSuggestionPrintout(createdSuggestions);
        const title = 'New Suggestions';
        const outEmbed = new MessageEmbed().setColor(EMBED_COLOUR).setTitle(title).setDescription(output);
        (messageChannel as TextChannel).send(outEmbed);
        // Update states
        await updateSuggestionState(createdSuggestionIds);
      } else {
        throw 'Bad channel type';
      }
    }
  });

// BOOTCAMP: Display information for the waiting room every min
export const waitingRoomsInfo = (client: CommandoClient): CronJob =>
  new CronJob('0 */1 * * * *', async function () {
    const bootcamp = await client.guilds.fetch(BOOTCAMP_GUILD_ID);
    if (bootcamp) {
      const infoChannel = <TextChannel>bootcamp.channels.cache.find((channel) => channel.name === 'waiting-room-info');

      if (!infoChannel) return;

      const waitingRooms = bootcamp.channels.cache
        .filter((channel) => channel.name.endsWith('-queue') && channel.type === 'text')
        .map((channel) => <TextChannel>channel);

      for (const queueChannel of waitingRooms) {
        const track = queueChannel?.parent?.name;

        const queueVoice = <VoiceChannel>(
          bootcamp.channels.cache.find((channel) => channel.name === track && channel.type === 'voice')
        );
        const queueMembers = queueVoice?.members;
        let waitCheck: string[] = [];
        queueMembers.forEach((mentee) => waitCheck.push(mentee.id));
        const fetched = await queueChannel.messages.fetch({ limit: 100 }).catch(console.log).catch(console.log);
        if (fetched) {
          const filtered = fetched.filter((msg) => {
            if (waitCheck.includes(msg.content)) {
              waitCheck = waitCheck.filter((mentee) => mentee !== msg.content);
              return false;
            }
            return true;
          });
          await queueChannel.bulkDelete(filtered);
        }
      }

      const infoMessage: string[] = [];
      // infoMessage.push('Last Updated: ' + new Date().toTimeString().replace(/.*(\d{2}:\d{2})(:\d{2}).*/, "$1"));
      infoMessage.push('\n<:clock2:886876718076399666> Waiting Room Lines:');
      for (const trackRoom of waitingRooms) {
        infoMessage.push(
          '\n<:gear:886874443450826812> **' +
            toTitleCase(trackRoom.name.split('-').slice(0, -1).join(' ')) +
            ' Track** <:gear:886874443450826812>'
        );
        const callCount = trackRoom.parent?.children?.filter((channel) => channel.type === 'voice').size;
        if (callCount == 1) {
          infoMessage.push('There is currently **1** ongoing call.');
        } else {
          infoMessage.push('There are currently **' + callCount + '** ongoing calls.');
        }
        const fetched = await trackRoom.messages.fetch({ limit: 100 }).catch(console.log);
        let i = 0;
        if (fetched) {
          fetched
            .sorted((mesgA, mesgB) => mesgA.createdTimestamp - mesgB.createdTimestamp)
            .forEach((mentee: Message) => {
              if (i == 0) infoMessage.push('\tNext in Line <:sunglasses:886875117894926386>');
              const inLine = bootcamp.members.cache.get(mentee.content);
              if (inLine) infoMessage.push(`${++i}. **${inLine.displayName}**`);
            });
        }
        if (i == 0) infoMessage.push('\tNobody in Line... <:smiling_face_with_tear:886882992692297769>');
      }
      // const Q = infoMessage.join('\n');
      (async (): Promise<void> => {
        const updateWaiting = await BootcampSettings.get('update_waiting_times');
        if (updateWaiting) {
          const fetched = await infoChannel.messages.fetch({ limit: 100 }).catch(console.log);
          if (fetched) {
            await infoChannel.bulkDelete(fetched);
          }
          for (const qPart of infoMessage) {
            infoChannel.send(qPart);
          }
        }
      })();
    }
  });

// BOOTCAMP: Controls mentor/mentee call timer every min
export const mentorCallTimer = (client: CommandoClient): CronJob =>
  new CronJob('0 */1 * * * *', async function () {
    const bootcamp = await client.guilds.fetch(BOOTCAMP_GUILD_ID);
    const mentorRole = await BootcampSettings.get('mentor_role');
    if (bootcamp) {
      const vcTexts = bootcamp.channels.cache
        .filter((channel) => channel.name.startsWith('call-') && channel.name.endsWith('-vc'))
        .map((channel) => <TextChannel>channel);

      vcTexts.forEach((chatChannel) => {
        (async (): Promise<void> => {
          const fetched = await chatChannel.messages.fetch({ limit: 100 }).catch(console.log);

          let timer;
          if (fetched) {
            timer = fetched.find(
              (msg: Message) => msg.author.id === client.user?.id && msg.content.endsWith(' remaining.')
            );
          }
          if (timer) {
            let minLeft = 1;
            let newTimer = timer.content.replace(/-?(\d+)+/g, (_match, num: string): string => {
              minLeft = parseInt(num) - 1;
              return minLeft.toString();
            });
            if (minLeft == 1) {
              newTimer = 'You have **1** minute remaining.';
            }
            // FIX NEEDED BUT STILL VIABLE
            if (minLeft == -1) {
              newTimer = "You're **1** minute past the time limit. Please wrap up your review!";
            }
            if (minLeft < 0) {
              newTimer = "You're **" + -minLeft + '** minutes past the time limit. Please wrap up your review!';
            } else {
              timer.edit(newTimer).then(() => {
                if (minLeft == 5) {
                  const queueVoice = <VoiceChannel>(
                    chatChannel.parent?.children?.find(
                      (channel) => channel.name === toTitleCase(chatChannel.name.split('-').slice(0, -1).join(' '))
                    )
                  );
                  const callMembers = queueVoice?.members;
                  let memberMentions = '';
                  callMembers?.forEach((member) => {
                    memberMentions = `${member.user}` + memberMentions;
                  });
                  chatChannel.send(memberMentions + '\n**5 minutes remaining**, please start wrapping up your review!');
                } else if (minLeft == 0) {
                  const queueVoice = <VoiceChannel>(
                    chatChannel.parent?.children?.find(
                      (channel) => channel.name === toTitleCase(chatChannel.name.split('-').slice(0, -1).join(' '))
                    )
                  );
                  const callMembers = queueVoice?.members;
                  let memberMentions = '';
                  callMembers?.forEach((member) => {
                    memberMentions = `${member.user}` + memberMentions;
                  });
                  chatChannel.send(memberMentions + '\n**Time is up!** Hope you had fun!');
                } else if (minLeft == -1) {
                  // OLD CODE TO KICK THE MENTEE
                  // const queueVoice = <VoiceChannel>(
                  //   chatChannel.parent?.children?.find(
                  //     (channel) => channel.name === toTitleCase(chatChannel.name.split('-').slice(0, -1).join(' '))
                  //   )
                  // );
                  // const callMembers = queueVoice?.members;
                  // callMembers
                  //   ?.filter((member) => !member.roles.cache.map((role) => role.id).includes(mentorRole))
                  //   .forEach((member) => {
                  //     member.voice.setChannel(null);
                  //   });
                }
              });
            }
          }
        })();
      });
    }
  });
