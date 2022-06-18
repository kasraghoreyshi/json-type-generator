import axios, { AxiosResponse } from "axios";
import * as vscode from "vscode";
import { defaultTypeName } from "./constants";
import { findLastEmptyLine, insertAndRevealRange } from "./utils/editor";
import { getTypeFromInput } from "./utils/types";

//TODO In need of refactoring.

interface GenerateTypesFromUrlArguments {
  url: string;
  urlPosition: vscode.Position;
  method?: "GET" | "POST";
}

const convertJsonToType = (json: AxiosResponse["data"]) => {
  return getTypeFromInput(json);
};

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "json-type-generator.generateTypesFromUrl",
    ({ url, urlPosition, method = "GET" }: GenerateTypesFromUrlArguments) => {
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Generating types from ${url}...`,
          cancellable: false,
        },
        async (progress, token) => {
          let requestData: string | undefined;
          if (method === "POST")
            requestData = await vscode.window.showInputBox({
              placeHolder:
                'Enter request data as a JSON (Optional) (E.g., {"name": "Alice", "age": 21})',
            });

          progress.report({ increment: 0 });

          const incrementProgress = (message: string) => {
            progress.report({ increment: 33, message });
          };

          let data: AxiosResponse["data"];

          try {
            let response: AxiosResponse;
            switch (method) {
              default:
              case "GET":
                response = await axios.get(url);
                break;
              case "POST":
                response = await axios.post(
                  url,
                  requestData ? JSON.parse(requestData) : null
                );
                break;
            }

            incrementProgress("Trying to fetch the URL...");

            data = await response.data;

            incrementProgress("Finished fetching the URL.");
          } catch (error) {}

          if (!data) {
            vscode.window.showErrorMessage(
              `Failed to generate types from ${url} (${method})`
            );
            return Promise.reject();
          }

          const generatedType = convertJsonToType(data);

          const line = findLastEmptyLine(urlPosition.line);

          await insertAndRevealRange(
            `type ${defaultTypeName} = ${JSON.stringify(generatedType).replace(
              /['"\\]/g,
              ""
            )}\n\n`,
            // The last empty line may include a line featuring a closing curly brace
            // And we want to write to the line after the curly brace, not the curly brace line itself.
            // So we will pass the line number plus one here.
            line + 1
          );

          incrementProgress("Generation was successful.");

          return Promise.resolve();
        }
      );
    }
  );

  context.subscriptions.push(disposable);

  vscode.languages.registerHoverProvider(
    "typescript",
    new (class implements vscode.HoverProvider {
      provideHover(
        _document: vscode.TextDocument,
        _position: vscode.Position,
        _token: vscode.CancellationToken
      ): vscode.ProviderResult<vscode.Hover> {
        const range = _document.getWordRangeAtPosition(
          _position,
          /(?<=(["'`]))(?:(?=(\\?))\2.)*(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})(?=\1)/g
        );

        if (!range) return;

        const url = _document.getText(range);

        const args: GenerateTypesFromUrlArguments = {
          url,
          urlPosition: range.start,
        };

        const typesCommandUri = (
          method: GenerateTypesFromUrlArguments["method"]
        ) => {
          return vscode.Uri.parse(
            `command:json-type-generator.generateTypesFromUrl?${encodeURIComponent(
              JSON.stringify([{ ...args, method }])
            )}`
          );
        };

        const contents = new vscode.MarkdownString(
          `Generate types from this URL: [GET](${typesCommandUri(
            "GET"
          )})  |  [POST](${typesCommandUri("POST")})`
        );

        contents.isTrusted = true;

        return new vscode.Hover(contents);
      }
    })()
  );
}

export function deactivate() {}
