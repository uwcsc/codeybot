# ADMIN
## ban
- **Aliases:** None
- **Description:** Ban a user.
- **Examples:**<br>  `.ban @jeff spam`
- **Options:** 
    - ``user``: The user to ban.
    - ``reason``: The reason why we are banning the user.
- **Subcommands:** None

# COIN
## coin
- **Aliases:** None
- **Description:** Handle coin functions.
- **Examples:**<br>`.coin adjust @Codey 100`<br>`.coin adjust @Codey -100 Codey broke.`<br>`.coin`<br>`.coin check @Codey`<br>`.coin c @Codey`<br>`.coin info`<br>`.coin i`<br>`.coin update @Codey 100`<br>`.coin update @Codey 0 Reset Codey's balance.`<br>`.coin transfer @Codey 10`<br>`.coin transfer @Codey 15 Lost a bet to Codey `
- **Options:** None
- **Subcommands:** `adjust`, `check`, `info`, `update`, `leaderboard`, `transfer`

## coin adjust
- **Aliases:** `a`
- **Description:** Adjust the coin balance of a user.
- **Examples:**<br>`.coin adjust @Codey 100`<br>`.coin adjust @Codey -100 Codey broke.`
- **Options:** 
    - ``user``: The user to adjust the balance of.
    - ``amount``: The amount to adjust the balance of the specified user by.
    - ``reason``: The reason why we are adjusting the balance.
- **Subcommands:** None

## coin check
- **Aliases:** `c`, `b`, `balance`, `bal`
- **Description:** The user to check the balance of.
- **Examples:**<br>`.coin check @Codey`<br>`.coin c @Codey`
- **Options:** 
    - ``user``: The user to check the balance of.
- **Subcommands:** None

## coin info
- **Aliases:** `information`, `i`
- **Description:** Get info about Codey coin.
- **Examples:**<br>`.coin info`<br>`.coin information`<br>`.coin i`
- **Options:** None
- **Subcommands:** None

## coin leaderboard
- **Aliases:** `lb`
- **Description:** Get the current coin leaderboard.
- **Examples:**<br>`.coin lb`<br>`.coin leaderboard`
- **Options:** None
- **Subcommands:** None

## coin transfer
- **Aliases:** `t`
- **Description:** Transfer coins from your balance to another user.
- **Examples:**<br>	`.coin transfer @Codey 10`<br>  `.coin transfer @Codey 10 Lost a bet to @Codey`
- **Options:** 
    - ``user``: The user to transfer coins to.
    - ``amount``: The amount to transfer to the specified user.
    - ``reason``: The reason for transferring.
- **Subcommands:** None

## coin update
- **Aliases:** `u`
- **Description:** Update the coin balance of a user.
- **Examples:**<br>  `.coin update @Codey 100`
- **Options:** 
    - ``user``: The user to update the balance of.
    - ``amount``: The amount to update the balance of the specified user to.
    - ``reason``: The reason why we are updating the balance.
- **Subcommands:** None

# COMPANY
## company
- **Aliases:** None
- **Description:** None
- **Examples:**<br>`.company add coinbase SRE`<br>`.company find coinbase`<br>
- **Options:** None
- **Subcommands:** `enroll`, `add`, `remove`, `find`, `profile`

## company add
- **Aliases:** `a`
- **Description:** Add a company to your profile
- **Examples:**<br>    `.company add https://www.crunchbase.com/organization/microsoft`<br>    `.company a microsoft `
- **Options:** 
- **Subcommands:** None

## company enroll
- **Aliases:** `e`
- **Description:** None
- **Examples:**<br>    `.company enroll https://www.crunchbase.com/organization/microsoft`<br>    `.company enroll microsoft`
- **Options:** 
- **Subcommands:** None

## company find
- **Aliases:** `f`
- **Description:** Find all individuals that work at the company.
- **Examples:**<br>    `.company find https://www.crunchbase.com/organization/microsoft`<br>    `.company f microsoft`
- **Options:** 
- **Subcommands:** None

## company profile
- **Aliases:** `p`
- **Description:** List all the companies you are associated with
- **Examples:**<br>    `.company profile`<br>    `.company p`
- **Options:** None
- **Subcommands:** None

## company remove
- **Aliases:** `r`
- **Description:** Remove a company to your profile
- **Examples:**<br>    `.company remove https://www.crunchbase.com/organization/microsoft`<br>    `.company r microsoft `
- **Options:** 
- **Subcommands:** None

# FUN
## flipcoin
- **Aliases:** `fc`, `flip`, `flip-coin`, `coin-flip`, `coinflip`
- **Description:** None
- **Examples:**<br>  `.flip-coin`<br>  `.fc`<br>  `.flip`<br>  `.coin-flip`<br>  `.coinflip`<br>  `.flipcoin`
- **Options:** None
- **Subcommands:** None

## rolldice
- **Aliases:** `rd`, `roll`, `roll-dice`, `dice-roll`, `diceroll`, `dice`
- **Description:** Roll a dice! :game_die:
- **Examples:**<br>  `.roll-dice 6`<br>  `.dice-roll 30`<br>  `.roll 100`<br>  `.rd 4`<br>  `.diceroll 2`<br>  `.dice 1`<br>  `.rolldice 10`
- **Options:** 
    - ``sides``: The number of sides on the die.
- **Subcommands:** None

# GAMES
## bj
- **Aliases:** `blj`, `blackjack`, `21`
- **Description:** Play a Blackjack game to win some Codey coins!
- **Examples:**<br>`.bj 100`<br>`.blj 100`
- **Options:** 
    - ``bet``: A valid bet amount
- **Subcommands:** None

## connect4
- **Aliases:** None
- **Description:** Play Connect 4!
- **Examples:**<br>`.connect4`<br>`.connect 4 @user`
- **Options:** None
- **Subcommands:** None

## rps
- **Aliases:** None
- **Description:** Play Rock, Paper, Scissors!
- **Examples:**<br>`.rps`<br>`.rps 10`
- **Options:** 
    - ``bet``: How much to bet - default is 10.
- **Subcommands:** None

# INTERVIEWER
## interviewers
- **Aliases:** `int`, `interviewer`
- **Description:** Handle interviewer functions.
- **Examples:**<br>`.interviewer`<br>`.interviewer frontend`
- **Options:** None
- **Subcommands:** `clear`, `domain`, `pause`, `profile`, `resume`, `signup`, `list`

## interviewer clear
- **Aliases:** `clr`
- **Description:** Clear all your interviewer data
- **Examples:**<br>`.interviewer clear`
- **Options:** None
- **Subcommands:** None

## interviewer domain
- **Aliases:** `domain`
- **Description:** Add/remove a domain of your choice
- **Examples:**<br>`.interviewer domain frontend`
- **Options:** 
    - ``domain_name``: A valid domain name
- **Subcommands:** None

## interviewer list
- **Aliases:** `ls`
- **Description:** List all interviewers or those under a specific domain
- **Examples:**<br>`.interviewer list`<br>`.interviewer list backend`
- **Options:** 
    - ``domain``: The domain to be examined
- **Subcommands:** None

## interviewer pause
- **Aliases:** `ps`
- **Description:** Put your interviewer profile on pause
- **Examples:**<br>`.interviewer pause`
- **Options:** None
- **Subcommands:** None

## interviewer profile
- **Aliases:** `pf`
- **Description:** Display your interviewer profile data
- **Examples:**<br>`.interviewer profile`
- **Options:** None
- **Subcommands:** None

## interviewer resume
- **Aliases:** `resume`
- **Description:** Resume your interviewer profile
- **Examples:**<br>`.interviewer resume`
- **Options:** None
- **Subcommands:** None

## interviewer signup
- **Aliases:** `signup`
- **Description:** Sign yourself up to be an interviewer!
- **Examples:**<br>`.interviewer signup www.calendly.com`
- **Options:** 
    - ``calendar_url``: A valid calendly.com or x.ai calendar link
- **Subcommands:** None

# LEETCODE
## leetcode
- **Aliases:** None
- **Description:** Handle LeetCode functions.
- 
- **Options:** None
- **Subcommands:** `random`, `specific`

## leetcode random
- **Aliases:** `r`
- **Description:** Get a random LeetCode problem.
- **Examples:**<br>`.leetcode`n<br>`.leetcode random`
- **Options:** 
    - ``difficulty``: The difficulty of the problem.
- **Subcommands:** None

## leetcode specific
- **Aliases:** `spec`, `s`
- **Description:** Get a LeetCode problem with specified problem ID.
- **Examples:**<br>`.leetcode specific 1`
- **Options:** 
    - ``problem-id``: The problem ID.
- **Subcommands:** None

# MISCELLANEOUS
## help
- **Aliases:** `wiki`
- **Description:** Get the URL to the wiki page.
- **Examples:**<br>`.help`<br>`.wiki`
- **Options:** None
- **Subcommands:** None

## info
- **Aliases:** None
- **Description:** Get Codey information - app version, repository link and issue templates.
- **Examples:**<br>  `.info`
- **Options:** None
- **Subcommands:** None

## member
- **Aliases:** None
- **Description:** Get CSC membership information of a user.
- **Examples:**<br>`.member [id]`
- **Options:** 
    - ``uwid``: The Quest ID of the user.
- **Subcommands:** None

## ping
- **Aliases:** `pong`
- **Description:** Ping the bot to see if it is alive. :ping_pong:
- **Examples:**<br>      `.ping`<br>      `.pong`
- **Options:** None
- **Subcommands:** None

## uptime
- **Aliases:** `up`, `timeup`
- **Description:** None
- **Examples:**<br>  `.uptime`<br>  `.up`<br>  `.timeup`
- **Options:** None
- **Subcommands:** None

# PROFILE
## profile
- **Aliases:** `userprofile`, `aboutme`
- **Description:** Handle user profile functions.
- **Examples:**<br>  `.profile @Codey`
- **Options:** None
- **Subcommands:** `about`, `grad`, `set`

## profile about
- **Aliases:** `a`
- **Description:** Display user profile.
- **Examples:**<br>  `.profile about @Codey`<br>  `.profile a @Codey`
- **Options:** 
    - ``user``: The user to give profile of.
- **Subcommands:** None

## profile grad
- **Aliases:** `g`
- **Description:** Update Grad Roles.
- **Examples:**<br>  `.profile grad`<br>  `.profile g`
- **Options:** None
- **Subcommands:** None

## profile set
- **Aliases:** `s`
- **Description:** Set parameters of user profile.
- **Examples:**<br>  `.profile set @Codey`<br>  `.profile a @Codey`
- **Options:** 
    - ``customization``: The customization to be set for the user.
    - ``description``: The description of the customization to be set for the user.
- **Subcommands:** None

# SUGGESTION 
## suggestion 
- **Aliases:** suggest
- **Description:** Handle suggestion functions.
- This command will forward a suggestion to the CSC Discord Mods.     Please note that your suggestion is not anonymous, your Discord username and ID will be recorded.     If you don't want to make a suggestion in public, you could use this command via a DM to Codey instead.
    **Examples:**
    `.suggestion I want a new Discord channel named #hobbies.`
- **Options:** 
    - ``details``: Details of your suggestion
- **Subcommands:** ``list``, ``update``, ``create``

# COFFEE CHAT 
## coffee 
- **Aliases:** None
- **Description:** Handle coffee chat functions.
- **Examples:**
    `.coffee match`
    `.coffee test 10`
- **Options:** None
- **Subcommands:** ``match``, ``test``

