const fs = require('fs');
const vm = require('vm');
const path = require('path');

const utilsPath = path.join(__dirname, '../renderer/scripts/presentation-utils.js');
const utilsCode = fs.readFileSync(utilsPath, 'utf8');

const context = {
    window: {},
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval
};

vm.createContext(context);
vm.runInContext(utilsCode, context);
const utils = context.window.presentationUtils;
if (!utils) {
    throw new Error('presentationUtils not available');
}

const markdownPath = path.join(__dirname, 'BINARY_MIGRATION_STATUS.md');
const markdown = fs.readFileSync(markdownPath, 'utf8');

const model = utils.buildPresentationModel(markdown);
console.log('Meta:', model.meta);
console.log('Slide count:', model.slides.length);
console.log('Sample slides:');
console.log(JSON.stringify(model.slides.slice(5, 15), null, 2));
