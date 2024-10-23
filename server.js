const { Builder, By, until } = require('selenium-webdriver');
const dotenv = require("dotenv").config();
const deeplHelper = require("./Helpers/DeeplHelper");

(async function loginAndExtractLinks() {
    let driver = await new Builder().forBrowser('chrome').build();

    try {
        await driver.get(process.env.ADMIN_LOGIN_PANEL);
        await driver.findElement(By.id('user_login')).sendKeys(process.env.ADMIN_USERNAME);
        await driver.findElement(By.id('user_pass')).sendKeys(process.env.ADMIN_PASS);
        await driver.findElement(By.id('wp-submit')).click();
        await driver.get(process.env.PAGES);

        let hasMorePages = true;

        while (hasMorePages) {
            await driver.wait(until.elementLocated(By.className('js-wpml-translate-link')), 5000);
            let wpmlLinks = await driver.findElements(By.className('js-wpml-translate-link'));
            let filteredLinks = [];

            for (let wpmlLink of wpmlLinks) {
                let icon = await wpmlLink.findElements(By.css('i.otgs-ico-add.js-otgs-popover-tooltip'));
                let originalLink = await wpmlLink.getAttribute('data-original-link');

                if (icon.length > 0 && originalLink && originalLink.startsWith('post-new.php')) {
                    filteredLinks.push(wpmlLink);
                }
            }

            if (filteredLinks.length === 0) {
                console.log('Tercüme edilecek daha fazla bağlantı yok.');
                hasMorePages = false; 
                break;
            }

            for (let wpmlLink of filteredLinks) {
                try {
                    let originalLink = await wpmlLink.getAttribute('data-original-link');
                    let urlParams = new URLSearchParams(originalLink.split('?')[1]);
                    let languageCode = urlParams.get('lang') || 'en-US';
                    await wpmlLink.click();
                    await driver.wait(until.elementLocated(By.css('.wpml-form-row:not(.hidden)')), 5000);

                    let visibleDivs = await driver.findElements(By.css('.wpml-form-row:not(.hidden)'));
                    for (let div of visibleDivs) {
                        try {
                            let originalValueInput = await div.findElement(By.className('original_value'));
                            let originalValue = await originalValueInput.getAttribute('value');

                            let newValue = await deeplHelper.DeeplTranslator(originalValue, languageCode);
                            let translatedValueInput = await div.findElement(By.className('translated_value'));

                            await translatedValueInput.clear();
                            await translatedValueInput.sendKeys(newValue);

                            console.log(`Orijinal: ${originalValue} | Çeviri: ${newValue} | Dil Kodu: ${languageCode}`);

                            try {
                                let checkbox = await div.findElement(By.css('.icl_tm_finished.js-field-translation-complete'));
                                await checkbox.click();
                            } catch (error) {
                                console.error('Checkbox işaretleme hatası:', error);
                            }

                        } catch (error) {
                            if (error.name === 'StaleElementReferenceError') {
                                console.log('Geçersiz öğe referansı, öğeyi yeniden bulmayı deniyorum...');
                                div = await driver.findElement(By.css('.wpml-form-row:not(.hidden)'));
                                let originalValueInput = await div.findElement(By.className('original_value'));
                                let originalValue = await originalValueInput.getAttribute('value');

                                let newValue = await deeplHelper.DeeplTranslator(originalValue, languageCode);
                                let translatedValueInput = await div.findElement(By.className('translated_value'));

                                await translatedValueInput.clear();
                                await translatedValueInput.sendKeys(newValue);
                            } else {
                                console.error('Bir hata oluştu:', error);
                            }
                        }
                    }

                    let saveButton = await driver.wait(until.elementLocated(By.className("button button-primary button-large wpml-dialog-close-button js-save-and-close")), 5000);
                    await saveButton.click();
                    await driver.wait(until.urlIs(process.env.PAGES), 10000);
                } catch (error) {
                    console.error('Linke tıklama sırasında bir hata oluştu:', error);
                }
            }
        }

    } finally {
        await driver.quit();
    }
})();
