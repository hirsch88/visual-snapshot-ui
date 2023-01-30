const fs = require("fs");
const glob = require("glob");
const path = require("path");

const PATH = path.join(__dirname, "actual");
const UI_PATH = path.join(__dirname, "ui");

if (fs.existsSync(UI_PATH)) {
  fs.rmSync(UI_PATH, { recursive: true, force: true });
}
fs.mkdirSync(UI_PATH);

glob(path.join(PATH, "**/*.png"), {}, function (err, files) {
  const failedFiles = files
    .filter((f) => !f.includes("/visual/"))
    .map((f) => path.dirname(f).split(path.sep).pop());

  const testFiles = files.filter((f) => f.includes("/visual/"));

  for (let index = 0; index < testFiles.length; index++) {
    const file = testFiles[index];

    const parts = file.split("/visual/")[1].split(".visual.cy.ts/");
    const componentName = parts[0];
    if (failedFiles.indexOf(`${componentName}.visual.cy.ts`) >= 0) {
        const folderName = path.dirname(file).split(path.sep).pop();

        const uiFolderPath = path.join(UI_PATH, folderName);

        if (!fs.existsSync(uiFolderPath)) {
          fs.mkdirSync(uiFolderPath);
        }

        fs.writeFileSync(
          path.join(uiFolderPath, `${parts[1]}.html`),
          htmlTemplate(componentName, parts[1].replace("-actual.png", ""))
        );
    }
  }
});

function htmlTemplate(componentName, fileName) {
  return `<html>
    <style>
        img {
            max-width: 100%;
            height: auto;
        }
    </style>
    <body style="padding: 0; margin: 0;">
        <div style="display: flex; flex-direction: column">
            <div style="display: flex; flex: 1; min-height: 50vh; background-color: #e8e8e8">
                <div style="flex: 1; display: flex; justify-content: center;">
                    <div style="padding: 16px;">
                        <img src="../../base/visual/${componentName}.visual.cy.ts/${fileName}-base.png" alt="base">
                    </div>
                </div>
                <div style="flex: 1; display: flex; justify-content: center;">
                    <div style="padding: 16px;">
                        <img src="../../actual/visual/${componentName}.visual.cy.ts/${fileName}-actual.png" alt="actual">
                    </div>
                </div>
            </div>
            <div style="display: flex; justify-content: center; min-height: 50vh; background-color: #ffaca6;">
                <div style="padding: 16px;">
                    <img src="../../diff/visual/${componentName}.visual.cy.ts/${fileName}-diff.png" alt="diff">
                </div>
            </div>
        </div>
    </body>

</html>`;
}
