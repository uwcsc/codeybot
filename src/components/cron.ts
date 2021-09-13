import { SuggestionState, getSuggestions, getSuggestionPrintout, updateSuggestionState } from './suggestions';
import { TextChannel, MessageEmbed, VoiceChannel } from 'discord.js';
import { CommandoClient } from 'discord.js-commando';
import { CronJob } from 'cron';
import { EMBED_COLOUR } from '../utils/embeds';
import { getEmojiByName } from '../components/emojis';
import { toTitleCase } from '../commands/mentors/utils';
import { mentorRole } from '../bot';

import _, { endsWith } from 'lodash';

const MOD_CHANNEL_ID: string = process.env.MOD_CHANNEL_ID || '.';
const EVENT_CHANNEL_ID: string = process.env.EVENT_CHANNEL_ID || '.';

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

// Display information for the waiting room every min
export const waitingRoomsInfo = (client: CommandoClient): CronJob =>
  new CronJob('0 */1 * * * *', async function () {
    const events = (await client.channels.fetch(EVENT_CHANNEL_ID)) as TextChannel;
    const guild = events?.guild;
    if (guild) {
      const infoChannel = <TextChannel>guild.channels.cache.find(channel => channel.name === "waiting-room-info");

      const waitingRooms = guild.channels.cache.filter(channel => channel.name.endsWith("-queue") && channel.type === "text").map(channel => <TextChannel>channel);

      for (const queueChannel of waitingRooms) {
        let track = queueChannel?.parent?.name

        const queueVoice = <VoiceChannel>guild.channels.cache.find(channel => channel.name === track && channel.type === "voice");
        let queueMembers = queueVoice?.members;
        let waitCheck: string[] = [];
        queueMembers.forEach(mentee => waitCheck.push(mentee.id));
        let fetched = await queueChannel.messages.fetch({limit: 100});
        let filtered = fetched.filter((msg) => {
          if (waitCheck.includes(msg.content)) {
            waitCheck = waitCheck.filter(mentee => mentee !== msg.content);
            return false;
          }
          return true;
        });
        await queueChannel.bulkDelete(filtered);
      }

      let infoMessage: string[] = [];

      infoMessage.push("\n<:clock2:886876718076399666> Waiting Room Lines:");
      for (const trackRoom of waitingRooms) {
        infoMessage.push("\n<:gear:886874443450826812> **" + toTitleCase(trackRoom.name.split("-").slice(0, -1).join(" ")) + " Track** <:gear:886874443450826812>");
        const callCount = trackRoom.parent?.children?.filter(channel => channel.type === "voice").size;
        if (callCount == 1) {
          infoMessage.push("There is currently **1** ongoing call.");
        } else {
          infoMessage.push("There are currently **" + callCount + "** ongoing calls.");
        }
        let fetched = await trackRoom.messages.fetch({limit: 100});
        let i = 0;
        fetched.forEach(mentee => {
          if (i == 0) infoMessage.push("\tNext in Line <:sunglasses:886875117894926386>");
          const inLine = guild.members.cache.get(mentee.content);
          if (inLine) infoMessage.push(`${++i}. **${inLine.displayName}**`);
        });
        if (i == 0) infoMessage.push("\tNobody in Line... <:smiling_face_with_tear:886882992692297769>");
      }
      (async(): Promise<void> => {
        let fetched = await infoChannel.messages.fetch({limit: 100});
        infoChannel.bulkDelete(fetched);
      })().then(async () => {
        infoChannel.send(infoMessage.join("\n"))
      });
    }
  });

// Controls mentor/mentee call timer every min
export const mentorCallTimer = (client: CommandoClient): CronJob =>
new CronJob('0 */1 * * * *', async function () {
  const events = (await client.channels.fetch(EVENT_CHANNEL_ID)) as TextChannel;
  const guild = events?.guild;
  if (guild) {
    const vcTexts = guild.channels.cache.filter(channel => channel.name.startsWith("call-") && channel.name.endsWith("-vc")).map(channel => <TextChannel>channel);

    vcTexts.forEach(chatChannel => {
      (async(): Promise<void> => {
        let fetched = await chatChannel.messages.fetch({limit: 100});

        let timer = fetched.find(msg => msg.author.id === client.user?.id && msg.content.endsWith(" remaining."));
        if (timer) {
          let minLeft: number = 1;
          let newTimer = timer.content.replace(/(\d+)+/g, (match, num): string => {
            minLeft = parseInt(num)-1;
            return (minLeft).toString();
          });
          if (minLeft == 1) newTimer = "You have **1** minute remaining.";
          timer.edit(newTimer).then(() => {
            if (minLeft == 5) {
              const queueVoice = <VoiceChannel>chatChannel.parent?.children?.find(channel => channel.name === toTitleCase(chatChannel.name.split("-").slice(0, -1).join(" ")));
              let callMembers = queueVoice?.members;
              let memberMentions = "";
              callMembers?.forEach(member => {
                memberMentions = `${member.user}` + memberMentions;
              });
              chatChannel.send(memberMentions + "\n**5 minutes remaining**, please start wrapping up your review!")
            } else if (minLeft == 0) {
              const queueVoice = <VoiceChannel>chatChannel.parent?.children?.find(channel => channel.name === toTitleCase(chatChannel.name.split("-").slice(0, -1).join(" ")));
              let callMembers = queueVoice?.members;
              let memberMentions = "";
              callMembers?.forEach(member => {
                memberMentions = `${member.user}` + memberMentions;
              });
              chatChannel.send(memberMentions + "\n**30 seconds remaining**, say goodbye before it's too late!")
            } else if (minLeft == -1) {
              const queueVoice = <VoiceChannel>chatChannel.parent?.children?.find(channel => channel.name === toTitleCase(chatChannel.name.split("-").slice(0, -1).join(" ")));
              let callMembers = queueVoice?.members;
              callMembers?.filter(member => !member.roles.cache.map(role => role.id).includes(mentorRole)).forEach(member => {
                member.voice.setChannel(null);
              })
            }
          })
        }
      })();
    });
  }
});