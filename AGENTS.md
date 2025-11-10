# Agent Handoff Document: Domain-Name-Brainstormer

**Last Updated**: 2025-11-10
**Current Agent**: Gemini

---

## 🎯 1. Current Status

### Project Overview
This is a command-line (CLI) tool for generating creative domain name suggestions and checking their real-time availability. It takes a keyword phrase as input and outputs a scored list of available domains.

### Deployment Status
*   **Status**: ✅ **Deployed as a Static Page**
*   **Platform**: Vercel
*   **Live URL**: [https://domain-brainstormer-fkz7bzhhh-mtsalts-projects.vercel.app](https://domain-brainstormer-fkz7bzhhh-mtsalts-projects.vercel.app)
*   **Note**: The Vercel deployment serves a landing page describing the CLI tool. The tool itself is intended to be run from the command line on a server or local machine.

### Technology Stack
*   **Language**: TypeScript
*   **Runtime**: Node.js
*   **Key Libraries**: `whois-json` for availability checks, `yargs` for CLI parsing.

### Key Files
*   `INSTRUCTIONS.md`: User-facing guide on how to use the CLI tool.
*   `src/cli.ts`: The main entry point for the command-line application.
*   `package.json`: Defines scripts and dependencies.

---

## 🚀 2. Recommended Improvements

This section outlines potential future enhancements for the project.

1.  **Web Interface**: Create a simple web interface for the tool, which could be hosted on the existing Vercel deployment. This would make it accessible to a wider audience who may not be comfortable with command-line tools.
2.  **Integration with TLD Lists**: Integrate with APIs that provide lists of trending or new Top-Level Domains (TLDs) to suggest more modern and relevant domain options.
3.  **Social Media Handle Check**: Add a feature to check for the availability of matching social media handles (e.g., Twitter, Instagram, TikTok) for the available domain names.
4.  **Bulk Analysis**: Allow users to input a list of keywords or a file containing keywords to generate and check domains in bulk.
5.  **Saved Sessions**: Add functionality to save the results of a brainstorming session to a local file so users can review them later without running the search again.

---

## 🤝 3. Agent Handoff Notes

### How to Work on This Project

*   **Running the Tool**: This is a CLI tool. The primary way to run it is from the project's root directory on the server using `npm start "your keyword"`.
*   **Development**: For development, you can use `npm run dev "your keyword"` to run the TypeScript source directly with `ts-node`.
*   **Dependencies**: The project uses npm for package management. Add any new dependencies to `package.json` and run `npm install`.
*   **Building**: To compile the TypeScript to JavaScript, run `npm run build`. The output is placed in the `dist/` directory.
*   **Updating Documentation**: If you make any user-facing changes to the CLI commands or options, update the `INSTRUCTIONS.md` file. If you make architectural changes, update this `AGENTS.md` file.

### What to Watch Out For

*   **WHOIS Rate Limiting**: The tool performs live WHOIS lookups, which can be rate-limited by domain registrars. The tool has some caching, but extensive use might lead to temporary blocks.
*   **`.gitignore`**: The `.gitignore` file is configured to ignore `.md` files. If you add new documentation, you may need to use the `-f` (force) flag when adding it to a commit (e.g., `git add -f MY_NEW_DOC.md`).
*   **Vercel Deployment**: The live URL only points to a static landing page. Changes to the CLI tool itself need to be tested from the command line; they will not be reflected on the website.
