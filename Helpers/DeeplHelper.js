const deepl = require("deepl-node")

module.exports.DeeplTranslator = async (message) => {
    const translator = new deepl.Translator(process.env.DEEPL_API_KEY)
    const result = await translator.translateText(message, null, 'en-US');
    var text=result.text
    return text
}