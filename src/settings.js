export default discovery => {
    discovery.view.define('label', function(el, config = {}) {
        const { text } = config;

        el.appendChild(document.createTextNode(String(text)));
    }, { tag: 'label' });

    discovery.view.define('fieldset', function(el, config, data, context) {
        const { onChange, onInit } = config;
        let { content } = config;
        const { label } = content;

        if (!Array.isArray(content)) {
            content = [content, { view: 'label', text: label }];
        }

        content.forEach(view => {
            view.onInit = onInit;
            view.onChange = onChange;
        });

        discovery.view.render(el, content, data, context);
    });

    discovery.view.define('flash-message', function(el, config) {
        const { message } = config;
        const { text, type } = message;
        const view = 'alert' + (type ? `-${type}` : '');

        discovery.view.render(el, {
            view,
            content: 'text:"' + text + '"'
        });
    });

    const modifiers = [
        {
            view: 'input',
            htmlType: 'number',
            htmlMin: 0,
            name: 'expandLevel',
            label: 'Expand Level'
        }
    ].map(content => ({ view: 'fieldset', content }));

    discovery.page.define('settings', function(el, data, context) {
        const { settings, message } = context;

        discovery.view.render(el, [
            'h1:"Settings"',
            {
                view: 'context',
                modifiers,
                content: [
                    {
                        view: 'button-primary',
                        content: 'text:"Save"',
                        onClick: (el, data, context) => {
                            saveSettings(context);
                        }
                    }
                ]
            },
            {
                view: 'flash-message',
                when: 'message',
                message
            }
        ], { message }, settings);
    });

    /**
     * Saves settings to storage
     * @param {Object} settings
     */
    function saveSettings(settings) {
        const { valid, errors } = validate(settings);

        if (valid) {
            if (typeof chrome !== 'undefined') {
                chrome.storage.sync.set(settings);
            } else if (typeof safari !== 'undefined') {
                safari.extension.dispatchMessage('setSettings', settings);
            }

            flashMessage({ settings }, 'Options saved.', 'success');
        } else {
            flashMessage({ settings }, errors.join(' '), 'danger');
        }
    }

    /**
     * Creates flash info-message
     * @param {Object} data
     * @param {string} text
     * @param {string} type
     */
    function flashMessage(data, text, type) {
        const message = {
            text,
            type
        };

        discovery.setData(
            discovery.data,
            Object.assign(discovery.context, data, { message })
        );

        setTimeout(() => {
            discovery.setData(
                discovery.data,
                Object.assign(discovery.context, data, { message: null })
            );
        }, 750);
    }

    /**
     * Validates settings
     * @param {Object} settings
     * @returns {Object}
     */
    function validate(settings) {
        const { expandLevel } = settings;

        let valid = true;
        const errors = [];

        if (!expandLevel || !Number.isInteger(Number(expandLevel))) {
            valid = false;
            errors.push('Expand level must be an integer number!');
        }

        return { valid, errors };
    }
};
