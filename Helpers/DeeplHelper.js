const deepl = require("deepl-node")

module.exports.DeeplTranslator = async (message, lang) => {
    try {
        lang == "en" ? lang = "en-US" : lang = lang;
        console.log(lang);
        const translator = new deepl.Translator(process.env.DEEPL_API_KEY)
        const result = await translator.translateText(message, null, lang);
        var text = result.text
        return text
    }
    catch (err) {
        console.error(err)
    }
}