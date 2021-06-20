# SEDAccord

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.0.5.

**[DISCLAIMER]** This project is currently a POC to demonstrate the utility of such a tool for agencies and archivists.
It means there is no true backend: mock data is returned from fake API endpoints in memory via ([in-memory-data.service.ts](src/app/services/in-memory-data.service.ts)), and SIP generation depends on an external beta service.
However, these fake endpoint can easily be replaced by true ones, and the frontend code be reused (except for some shortcuts, like authentication, indicated in code).

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Coding style guide

See TSLint ([tslint.json](tslint.json)) and TSConfig ([tsconfig.json](tsconfig.json)) configuration files.

On IntelliJ IDEA:
- Enable the TSLint, JavaScript and TypeScript bundled plugins to start checking your code.
It will use the configuration file by default.
- Code style configuration (e.g. for Rearrange Code action) is shared under `/.idea/codeStyles`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Deploy to GitHub Pages (prototype only)

Run `ng deploy --base-href=/sedaccord-app/` to deploy the Angular application to GitHub Pages.

## Browser compatibility

Folder upload feature is not available on Internet Explorer and some outdated browsers (see [Directory selection from file input support reference](https://caniuse.com/input-file-directory)).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
