import fs from 'fs';
import path from 'path';

const folderPath = './Commands/spaceCommands'; // Assuming this script is in the spaceCommands folder
const commandsPath = path.join(folderPath, 'commands.js');

async function generateExportStatements(folderPath) {
  const files = fs.readdirSync(folderPath).filter((file) => file !== 'commands.js' && file.endsWith('.js'));

  const exportPromises = files.map(async (file) => {
    const moduleName = path.parse(file).name;
    const modulePath = '../' + path.join(folderPath, file); // Construct the correct module path using path.join
    const moduleContents = await import(modulePath);

    // Determine the exported class name based on the module's content
    let className;
    if (moduleContents.default && typeof moduleContents.default === 'function') {
      // If there is a default export, use the default export's name
      className = moduleContents.default.name;
    } else {
      // If there's no default export, use the module name as the class name
      className = moduleName;
    }


    if(moduleName !== className) {
      const newPath = folderPath + '/' + className + '.js'
      fs.renameSync(folderPath + '/' + moduleName + '.js', newPath); // Rename the file
    }

    let exportStatement;
    // Use the class name as the export statement
    exportStatement = `export { default as ${className} } from "./${className}.js";`;
    console.log(`Exported: ${className}`)

    return exportStatement;
  });

  return Promise.all(exportPromises);
}

(async () => {
  const exportStatements = await generateExportStatements(folderPath);
  fs.writeFileSync(commandsPath, exportStatements.join('\n'));
})();
