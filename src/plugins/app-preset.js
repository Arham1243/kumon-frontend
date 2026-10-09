import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

const AppPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#e2e8f0',
            100: '#e2e8f0',
            200: '#326cde',
            300: '#1f54bf',
            400: '#19459c',
            500: '#14377d',
            600: '#0f295e',
            700: '#091a3b',
            800: '#162f69',
            900: '#172856',
            950: '#162144'
        },
        formField: {
            padding: {
                x: '0.75rem',
                y: '0.6rem'
            }
        }
    },
    components: {
        button: {
            root: {
                padding: {
                    x: '1.15rem',
                    y: '.63rem'
                }
            }
        }
    }
});

export default AppPreset;
