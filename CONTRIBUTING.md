# Project Setup

### Basic/Starter Setup
1. Clone this repository.
2. Create a `.env` file in the root directory. You'll need to set the following environment variables:
```env
# this makes you see some extra dev mode stuff not meant for normal users
ENVIRONMENT=dev
# use whatever port you like!
PORT=????
URL_ORIGIN=https://localhost:????/

# copy this stuff exactly
API_ORIGIN=https://api.fluff4.me/
URL_REWRITE=(not starts_with(http.request.uri.path, "/image/") and not starts_with(http.request.uri.path, "/font/") and not starts_with(http.request.uri.path, "/style/") and not starts_with(http.request.uri.path, "/lang/") and not starts_with(http.request.uri.path, "/beta/") and not starts_with(http.request.uri.path, "/js/") and http.request.uri.path ne "/env.json" and http.request.uri.path ne "/CNAME" and http.request.uri.path ne "/index.css" and http.request.uri.path ne "/index.js" and http.request.uri.path ne "/manifest.webmanifest" and http.request.uri.path ne "/oembed.json")
```
3. Run `npm ci` to grab initial copies of dependencies, which allows our custom tasks to work.
4. Run `npm run ci:dev` to *fully* install dependencies and set up the project.  
You'll need to run this again whenever dependencies are updated (which is pretty common, I update chirilang a lot.)
5. Have eslint enabled in your editor. If you're using VSCode, you can use the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint).
6. Run `npm run watch` to start the development server in watch mode. You can also separately, manually run `npm run build` and `npm run serve` if you like. This won't be watched for file changes.

### Advanced Setup
Advanced project setup is only necessary if you want to also potentially contribute to the [`chiri`](https://github.com/fluff4me/chiri) or [`weaving`](https://github.com/ChiriVulpes/weaving) dependencies.
1. Perform the basic project setup as described above.
2. Clone the [`chiri`](https://github.com/fluff4me/chiri) and [`weaving`](https://github.com/ChiriVulpes/weaving) repositories. It'll be easiest if they're cloned in the same parent directory as this project.  
When you're about to do dev, make sure to pull the latest changes from those repositories as well as they won't be automatically updated.
2. Add the following to your `.env` file:
```env
# this needs to include relative paths to the "chiri" project and the "weaving" project which must both be on your machine
# this example assumes you have the chiri and weaving projects in the same parent directory as this project
NPM_LINK=(chiri:"./chiri" weaving:"./weaving/build")

# if you intend to be making changes to chiri's default library, you might want chirilang to watch for changes to that folder:
CHIRI_ENV=dev
```
4. Run `npm run ci:dev` again. You shouldn't have to run this quite as often as with just the basic setup since you have your own copy of chirilang now.
5. You can use the `npm run watch`, `npm run build`, and `npm run serve` commands as described in the basic project setup. `npm run watch` will watch the chirilang lib for changes as well if you've set that environment variable.

# Contributing
1. Please chat with us on Discord to make sure any changes you want to make have been approved first — I don't want to have to shut people down in PRs for things I wouldn't have wanted to do in the first place. >.<
2. Make sure your changes have been linted according to our lint rules.
3. Do not commit changes to `package.json` or `package-lock.json`. We'll be in charge of that. If you need a dependency updated, let us know on Discord.
4. Give me some time to review your PR, especially if it touches a lot of files. Thanks!
