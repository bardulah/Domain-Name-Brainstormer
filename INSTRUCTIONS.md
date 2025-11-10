# Instructions for Domain Name Brainstormer

This guide provides instructions on how to use the Domain Name Brainstormer tool.

## What It Does

This is a command-line tool that helps you find creative and available domain names for your projects or business.

You provide it with a keyword or phrase, and it will:
*   Generate a list of high-quality, brandable domain name suggestions.
*   Check in real-time if those domain names are available to be registered.
*   Score each suggestion based on factors like length, pronounceability, and brandability.

## How to Use It

This is a Command-Line Interface (CLI) tool, which means you run it from your terminal.

### Prerequisites

*   You must be logged into the server where the tool is located.
*   Navigate to the project directory: `cd /optdeployment/repos/Domain-Name-Brainstormer`

### Basic Usage

The simplest way to use the tool is to provide a search phrase.

```bash
# Run the tool with your idea
npm start "AI-powered task manager"
```

The tool will then output a list of domain suggestions, indicating whether they are `AVAILABLE` or `TAKEN`.

### Customizing Your Search

You can use several options to get more specific results.

**1. Specifying TLDs**

Use the `--tlds` flag to check different Top-Level Domains (e.g., `.com`, `.io`, `.ai`).

```bash
npm start "cloud storage app" -- --tlds ".com,.io,.app,.ai"
```

**2. Changing the Number of Suggestions**

Use the `--max` flag to control how many suggestions you get.

```bash
npm start "fitness tracker for dogs" -- --max 25
```

**3. Setting a Minimum Quality Score**

Use the `--min-score` flag to filter out lower-quality suggestions (score is 0-100).

```bash
npm start "developer community platform" -- --min-score 75
```

**4. Getting JSON Output**

If you want to use the output in another program, you can get it in JSON format.

```bash
npm start "my awesome startup idea" -- --json
```

This tool is perfect for quickly brainstorming and validating domain ideas without having to manually check a domain registrar's website for every single idea.
