const { Builder, By, until } = require('selenium-webdriver');
const dotenv = require("dotenv").config();
const deeplHelper = require("./Helpers/DeeplHelper");

(async function loginAndExtractLinks() {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        await driver.get(process.env.ADMIN_LOGIN_PANEL);  // Giriş URL'nizi değiştirin
        await driver.findElement(By.id('user_login')).sendKeys(process.env.ADMIN_USERNAME);
        await driver.findElement(By.id('user_pass')).sendKeys(process.env.ADMIN_PASS);
        await driver.findElement(By.id('wp-submit')).click();
        await driver.get(process.env.PAGES);
        let wpmlLinks = await driver.findElements(By.className('js-wpml-translate-link'));
        for (let wpmlLink of wpmlLinks) {
            try {
                await wpmlLink.click();
                await driver.wait(until.elementLocated(By.css('.wpml-form-row:not(.hidden)')), 5000);
                let visibleDivs = await driver.findElements(By.css('.wpml-form-row:not(.hidden)'));
                for (let div of visibleDivs) {
                    try {
                        let originalValueInput = await div.findElement(By.className('original_value'));
                        let translatedValueInput = await div.findElement(By.className('translated_value'));
                        let originalValue = await originalValueInput.getAttribute('value');
                        let translatedValue = await translatedValueInput.getAttribute('value');
                        await translatedValueInput.clear();
                        let newValue = await deeplHelper.DeeplTranslator(originalValue);
                        await translatedValueInput.sendKeys(newValue);

                        console.log(`Orijinal: ${originalValue} | Çeviri: ${newValue}`);
                    } catch (error) {
                        if (error.name === 'StaleElementReferenceError') {
                            console.log('Geçersiz öğe referansı, öğeyi yeniden bulmayı deniyorum...');
                            let updatedDiv = await driver.findElement(By.css(`.wpml-form-row:not(.hidden)`));
                            let originalValueInput = await updatedDiv.findElement(By.className('original_value'));
                            let translatedValueInput = await updatedDiv.findElement(By.className('translated_value'));
                        } else {
                            console.error('Bir hata oluştu:', error);
                        }
                    }
                }
                // await driver.findElement(By.className("button button-primary button-large wpml-dialog-close-button js-save-and-close")).click()

                // await driver.navigate().back();
            } catch (error) {
                console.error('Linke tıklama sırasında bir hata oluştu:', error);
            }
        }

    } finally {
        // await driver.quit();
    }
})();