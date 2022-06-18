import * as vscode from "vscode";

export const findLastEmptyLine = (startingLine: number) => {
  let currentLine = startingLine;

  const editor = vscode.window.activeTextEditor;

  if (!editor) return 0;

  while (
    !editor.document.lineAt(currentLine).text.includes("}") &&
    editor.document.lineAt(currentLine).text.trim().length >= 1
  ) {
    currentLine--;
    if (currentLine === 0) break;
  }

  return currentLine;
};

export const insertAndRevealRange = async (text: string, line: number) => {
  const linePosition = new vscode.Position(line, 0);

  const editor = vscode.window.activeTextEditor;

  if (!editor) return;

  await editor.edit((editBuilder) => {
    editBuilder.insert(linePosition, text);
  });
  await editor.revealRange(new vscode.Range(linePosition, linePosition));
};
