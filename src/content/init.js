import { loader } from '@discoveryjs/discovery/dist/discovery-loader.js';

export const init = initDiscoveryBundled => {
    let loaded = document.readyState === 'complete';
    let pre = null;
    let initialPreDisplay = null;
    let af;

    af = requestAnimationFrame(async function x() {
        if (
            document.body &&
            document.body.firstElementChild &&
            document.body.firstElementChild.tagName === 'PRE' &&
            initialPreDisplay === null
        ) {
            pre = document.body.firstElementChild;
            initialPreDisplay = window.getComputedStyle(pre).display;
            pre.style.display = 'none';
        }

        if (!loaded) {
            cancelAnimationFrame(af);
            af = requestAnimationFrame(x);
        }

        if (pre !== null && loaded) {
            let json;

            const textContent = pre.textContent.trim();

            if (!textContent.startsWith('{') && !textContent.startsWith('[')) {
                pre.style.display = initialPreDisplay;
                return;
            }

            try {
                json = JSON.parse(textContent);
            } catch (e) {
                pre.style.display = initialPreDisplay;
                console.error(e.message); // eslint-disable-line no-console
            }

            if (!json) {
                pre.style.display = initialPreDisplay;
                return;
            }

            document.body.innerHTML = '';

            document.body.style.margin = 0;
            document.body.style.padding = 0;
            document.body.style.height = '100vh';
            document.body.style.border = 'none';

            // Firefox bundled version
            if (typeof initDiscoveryBundled === 'function') {
                const settings = await getSettings();

                initDiscoveryBundled({
                    node: document.body,
                    raw: textContent,
                    settings,
                    styles: [chrome.runtime.getURL('index.css')]
                }, json);
            }

            try {
                const settings = await getSettings();
                const data = await loader({
                    data: json,
                    darkmode: settings.darkmode
                });

                const { initDiscovery } = await import(chrome.runtime.getURL('init-discovery.js'));

                initDiscovery({
                    node: document.body,
                    raw: textContent,
                    settings,
                    styles: [chrome.runtime.getURL('index.css')]
                }, data);
            } catch (_) {}
        }
    });

    window.addEventListener('DOMContentLoaded', () => loaded = true, false);
};

/**
 * Restores settings from storage
 * @returns {Promise}
 */
function getSettings() {
    return new Promise(resolve => {
        chrome.storage.sync.get({
            expandLevel: 3,
            darkmode: 'auto'
        }, settings => {
            resolve(settings);
        });
    });
}
