const fs = require("fs");
const glob = require("glob");
const path = require("path");
const prompts = require("prompts");

const DIRNAME = path.join(__dirname);
const SNAPSHOT_PATH = path.join(DIRNAME, "snapshots");

(async () => {
  const snapshots = readSnapshotFolders();

  const response = await prompts({
    type: "select",
    name: "value",
    message: "Pick a snapshot",
    choices: snapshots,
    initial: 0,
  });

  const chosenSnapshotFolder = snapshots[response.value].title;
  const snapshotFolderPath = path.join(SNAPSHOT_PATH, chosenSnapshotFolder);
  const uiFolderPath = path.join(snapshotFolderPath, "ui");

  createFolder(uiFolderPath);

  const images = await loadBaseImages(snapshotFolderPath);

  for (let index = 0; index < images.length; index++) {
    const image = images[index];
    const testFolder = path.join(uiFolderPath, folderName(image));

    if (!fs.existsSync(testFolder)) {
      fs.mkdirSync(testFolder);
    }

    fs.writeFileSync(
      path.join(testFolder, `${fileName(image)}.html`),
      htmlTemplate(snapshotFolderPath, image)
    );
  }
})();

function readSnapshotFolders() {
  return fs
    .readdirSync(SNAPSHOT_PATH)
    .filter((d) => d.startsWith("cypress"))
    .reverse()
    .map((d) => ({
      title: d,
    }));
}

function createFolder(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.rmSync(folderPath, { recursive: true, force: true });
  }
  fs.mkdirSync(folderPath);
}

function folderName(file) {
  return path.dirname(file).split(path.sep).pop();
}

function fileName(file) {
  return file.split(path.sep).pop().replace("-actual.png", "");
}

function loadBaseImages(folderPath) {
  return new Promise((resolve) => {
    glob(path.join(folderPath, "actual/**/*.png"), {}, function (_err, files) {
      const failedFiles = files
        .filter((f) => !f.includes("/visual/"))
        .map((f) => path.dirname(f).split(path.sep).pop());

      const testFiles = files.filter((f) => f.includes("/visual/"));

      resolve(testFiles.filter((f) => failedFiles.includes(folderName(f))));
    });
  });
}

function htmlTemplate(snapshotFolder, file) {
  const imagePath = `../..${file
    .replace(snapshotFolder, "")
    .replace("-actual.png", "")}`;
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
                        <img src="${imagePath.replace(
                          "actual",
                          "base"
                        )}-base.png" alt="base">
                    </div>
                </div>
                <div style="flex: 1; display: flex; justify-content: center;">
                    <div style="padding: 16px;">
                      <img src="${imagePath}-actual.png" alt="actual">
                    </div>
                </div>
            </div>
            <div style="display: flex; justify-content: center; min-height: 50vh; background-color: #ffaca6;">
              <div style="padding: 16px;">
                <img src="${imagePath.replace(
                  "actual",
                  "diff"
                )}-diff.png" alt="diff">                
                </div>
            </div>
        </div>
    </body>

</html>`;
}
