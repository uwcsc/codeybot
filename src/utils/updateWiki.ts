import { statSync } from 'fs';
import { appendFile, writeFile, readdir, readFile } from 'fs/promises';

// File Paths
const wikiPath = 'docs/COMMAND-WIKI.md';
const commandsDir = 'src/commands';
const commandDetailsDir = 'src/commandDetails';

// Commands with subcommands, to be handled separately
const compoundCommands = ['coin', 'company', 'interviewer', 'leetcode', 'profile'];

// RegEx patterns to extract info
const commandDetailsPattern = /.*const .+CommandDetails: CodeyCommandDetails = {([\s\S]*?)\n}/;
const namePattern = /name: '(.*?)'/;
const aliasesPattern = /aliases: \[([\s\S]*?)\]/;
const descriptionPattern = /description: '(.*?)'/;
const detailedDescriptionPattern = /detailedDescription: `([\s\S]*?)`,/;
const optionsPattern = /options: \[([\s\S]*?)\]/;
const subcommandDetailsPattern = /subcommandDetails: {([\s\S]*?)},/;

// ----------------------------------- START OF UTILITY FUNCTIONS ---------------------------- //

const refreshWiki = async () => {
    await writeFile(wikiPath, '');
};

const formatCommandName = async (name: string | undefined) => {
    let formattedName = '';
    if (name === undefined) {
        formattedName = 'None';
    }
    else {
        formattedName = name;
    }
    await appendFile(wikiPath, `## ${formattedName}\n`);
};

const formatSubcommandName = async (name: string | undefined, basecmd: string) => {
    let formattedName = '';
    if (name === undefined) {
        formattedName = 'None';
    }
    else {
        formattedName = name;
    }
    await appendFile(wikiPath, `## ${basecmd} ${formattedName}\n`);
};

const formatAliases = async (aliases: string | undefined) => {
    let formattedAliases = '';
    if (aliases === undefined || aliases === '') {
        formattedAliases =  'None';
    }
    else {
        formattedAliases = aliases.replace(/'/g, '').split(', ').map(alias => `\`${alias}\``).join(', ')
    }
    await appendFile(wikiPath, `- **Aliases:** ${formattedAliases}\n`);
};

const formatDescription = async (descr: string | undefined) => {
    let formattedDescription = '';
    if (descr === undefined) {
        formattedDescription = 'None';
    }
    else {
        formattedDescription = descr;
    }
    await appendFile(wikiPath, `- **Description:** ${formattedDescription}\n`);
};

const formatDetailedDescription = async (listStr: string | undefined) => {
    let formattedDetailedDescription = '';
    if (listStr === undefined) {
        formattedDetailedDescription = 'None';
    }
    else {
        const newlineList = listStr.replace(/\n/g, "<br>");
        const botPrefixList = newlineList.replace(new RegExp('\\${container.botPrefix}', 'g'), ".");
        const bulletList = botPrefixList.replace(/\\/g, '');
        formattedDetailedDescription = bulletList;
    }
    await appendFile(wikiPath, `- ${formattedDetailedDescription}\n`);
};

const formatOptions = async (options: string[] | undefined) => {
    if (options === undefined || options[0] === '') {
        await appendFile(wikiPath, `- **Options:** None\n`);
    }
    else {
        let fieldMatch;
        const extractedOptions = [];
        const optionFieldsPattern = /\{\s*name: '(.*?)',\s*description: '(.*?)'/g;
        while ((fieldMatch = optionFieldsPattern.exec(options![0])) !== null) {
            const name = fieldMatch[1];
            const description = fieldMatch[2];
            extractedOptions.push({ name, description });
        }
        await appendFile(wikiPath, `- **Options:** \n`);
        for (const desc of extractedOptions) {
            await appendFile(wikiPath, `    - \`\`${desc.name}\`\`: ${desc.description}\n`);
        }
    }
};

const formatSubcommandDetails = async (subcommandDetails: string | undefined) => {
    let formattedSubcommandDetails = '';
    if (subcommandDetails === undefined || subcommandDetails === '') {
        formattedSubcommandDetails = 'None';
    }
    else {
        const regex = /\b(\w+)\s*:/g;
        const matches = subcommandDetails.match(regex);
        if (matches) {
            const subcommandList = matches.map(match => match.trim().replace(/:$/, '')).join(', ');
            formattedSubcommandDetails = subcommandList.replace(/'/g, '').split(', ').map(subcmd => `\`${subcmd}\``).join(', ')
        }
    }
    await appendFile(wikiPath, `- **Subcommands:** ${formattedSubcommandDetails}\n\n`);
};

// ----------------------------------- END OF UTILITY FUNCTIONS ---------------------------- //

export const updateWiki = async () => {
    // Refresh COMMAND-WIKI.md
    await refreshWiki();

    const filesAndDirs = await readdir(commandDetailsDir);
    const directories = filesAndDirs.filter(file => (statSync(`${commandDetailsDir}/${file}`).isDirectory()));

    for (const dir of directories) {
        if (!compoundCommands.includes(dir)) {
            await appendFile(wikiPath, `# ${dir.toUpperCase()}\n`);
            const subDir = `${commandDetailsDir}/${dir}`;
            const files = await readdir(subDir);
            for (const file of files) {
                const filePath = `${subDir}/${file}`;
                const content = await readFile(filePath, 'utf-8');
                const match = content.match(commandDetailsPattern);
                if (match) {
                    const codeSection = match[1];

                    // Extract info pieces
                    const name = codeSection.match(namePattern)?.[1];
                    const aliases = codeSection.match(aliasesPattern)?.[1];
                    const description = codeSection.match(descriptionPattern)?.[1];
                    const detailedDescription = codeSection.match(detailedDescriptionPattern)?.[1];
                    const options = codeSection.match(optionsPattern)?.[1].split(', ');
                    const subcommandDetails = codeSection.match(subcommandDetailsPattern)?.[1];

                    // Format the info
                    await formatCommandName(name);
                    await formatAliases(aliases);
                    await formatDescription(description);
                    await formatDetailedDescription(detailedDescription);
                    await formatOptions(options);
                    await formatSubcommandDetails(subcommandDetails);
                }
            }
        }
        else {
            await appendFile(wikiPath, `# ${dir.toUpperCase()}\n`);
            const mainCommandDir = `${commandsDir}/${dir}`;
            const subCommandsdir = `${commandDetailsDir}/${dir}`;
            
            // Retrieve overview info
            const mainCommandFiles = await readdir(mainCommandDir);
            for (const file of mainCommandFiles) {
                const filePath = `${mainCommandDir}/${file}`;
                const content = await readFile(filePath, 'utf-8');
                const match = content.match(commandDetailsPattern);
                if (match) {
                    const codeSection = match[1];

                    // Extract info pieces
                    const name = codeSection.match(namePattern)?.[1];
                    const aliases = codeSection.match(aliasesPattern)?.[1];
                    const description = codeSection.match(descriptionPattern)?.[1];
                    const detailedDescription = codeSection.match(detailedDescriptionPattern)?.[1];
                    const options = codeSection.match(optionsPattern)?.[1].split(', ');
                    const subcommandDetails = codeSection.match(subcommandDetailsPattern)?.[1];

                    // Format the info
                    await formatCommandName(name);
                    await formatAliases(aliases);
                    await formatDescription(description);
                    await formatDetailedDescription(detailedDescription);
                    await formatOptions(options);
                    await formatSubcommandDetails(subcommandDetails);
                }
            }

            // Retrieve subcommand infos
            const subCommandFiles = await readdir(subCommandsdir);
            for (const file of subCommandFiles) {
                const filePath = `${subCommandsdir}/${file}`;
                const content = await readFile(filePath, 'utf-8');
                const match = content.match(commandDetailsPattern);
                if (match) {
                    const codeSection = match[1];

                    // Extract info pieces
                    const name = codeSection.match(namePattern)?.[1];
                    const aliases = codeSection.match(aliasesPattern)?.[1];
                    const description = codeSection.match(descriptionPattern)?.[1];
                    const detailedDescription = codeSection.match(detailedDescriptionPattern)?.[1];
                    const options = codeSection.match(optionsPattern)?.[1].split(', ');
                    const subcommandDetails = codeSection.match(subcommandDetailsPattern)?.[1];

                    // Format the info
                    await formatSubcommandName(name, dir);
                    await formatAliases(aliases);
                    await formatDescription(description);
                    await formatDetailedDescription(detailedDescription);
                    await formatOptions(options);
                    await formatSubcommandDetails(subcommandDetails);
                }
            }
        }
    }

    // Harcoding info for suggestion until it can be migrated to CodeyCommand framework
    await appendFile(wikiPath, `# Suggestion \n`);
    await appendFile(wikiPath, `## suggestion \n`);
    await appendFile(wikiPath, `- **Aliases:** suggest\n`);
    await appendFile(wikiPath, `- **Description:** Handle suggestion functions.\n`);
    await appendFile(wikiPath, `- This command will forward a suggestion to the CSC Discord Mods. \
    Please note that your suggestion is not anonymous, your Discord username and ID will be recorded. \
    If you don't want to make a suggestion in public, you could use this command via a DM to Codey instead.
    **Examples:**
    \`.suggestion I want a new Discord channel named #hobbies.\`\n`);
    await appendFile(wikiPath, `- **Options:** \n`);
    await appendFile(wikiPath, `    - \`\`details\`\`: Details of your suggestion\n`);
    await appendFile(wikiPath, `- **Subcommands:** \`\`list\`\`, \`\`update\`\`, \`\`create\`\`\n\n`);

    // Harcoding info for coffechat until it can be migrated to CodeyCommand framework
    await appendFile(wikiPath, `# coffee \n`);
    await appendFile(wikiPath, `## coffee \n`);
    await appendFile(wikiPath, `- **Aliases:** None\n`);
    await appendFile(wikiPath, `- **Description:** Handle coffee chat functions.\n`);
    await appendFile(wikiPath, `- **Examples:**
    \`.coffee match\`
    \`.coffee test 10\`\n`);
    await appendFile(wikiPath, `- **Options:** None\n`);
    await appendFile(wikiPath, `- **Subcommands:** \`\`match\`\`, \`\`test\`\`\n\n`);
};
