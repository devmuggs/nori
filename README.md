# Nori (のり)

Nori is a free and open-source translation management system designed to help developers and translators collaborate on localisation projects. It provides a simple and efficient way to manage translations for software applications, websites, and other digital content.

## Why Nori?

Nori is a fundamental part of many types of Japanese cuisine, used to wrap (maku) various ingredients to create delicious dishes. Just as nori enhances the flavour and presentation of food, Nori (the software) enhances the translation process by providing a robust platform for managing and collaborating on localisation projects.

## Features (P0)

-   [ ] CLI Tool to serve as developer-first interface
-   [ ] YAML-based configuration for easy setup
-   [ ] Support for multiple translation file formats (e.g., JSON, YAML, PO)
-   [ ] File based, git-friendly storage of translations (easy diffs and versioning)
-   [ ] Type-safe code generation of your i18n library to your preferred programming language (Starting with TypeScript & Python)

## Features (P1)

-   [ ] Web interface for non-technical collaborators
-   [ ] Real-time collaboration and editing of translations

## Features (P2)

-   [ ] Integration with popular version control systems (e.g., GitHub, GitLab)
-   [ ] API for programmatic access to translation data
-   [ ] User authentication and role-based access control

## Installation

Nori is a monorepo with multiple packages. To get started:

1. **Clone the repository**:

    ```bash
    git clone https://github.com/your-username/nori.git
    cd nori
    ```

2. **Install dependencies** (for the CLI package):

    ```bash
    cd packages/cli
    npm install
    ```

3. **Link the CLI globally** (for local development):
    ```bash
    npm link
    ```
    Now you can run `npx nori` from anywhere.

## Usage

### Initialize a Nori Project

Run the interactive setup:

```bash
npx nori --init
```

This will prompt for project details and create a `nori.yaml` configuration file.

### Generate Translation Files

Once configured, generate code or files:

```bash
npx nori generate
```

Set the YAML path via environment variable:

```bash
export NORI_YAML_PATH=./nori.yaml
npx nori generate
```

### Example YAML Configuration

```yaml
metadata:
    generator:
        name: nori
        version: 1.0.0

collections:
    core:
        entries:
            welcome:
                params:
                    type: string
                locales:
                    en: "Welcome"
                    ja: "ようこそ"
```

## Project Structure

-   `packages/cli/`: The command-line interface.
-   `packages/api-backend/`: Backend API (planned).
-   `packages/web-client/`: Web interface (planned).

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) and submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
