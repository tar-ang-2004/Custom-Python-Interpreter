/**
 * PyInter - Advanced Theme and Customization System
 * Supports 10+ themes, accent colors, fonts, glassmorphism, and more
 */

// ============================================
// THEME DEFINITIONS (10+ Themes)
// ============================================

const THEMES = {
    // Dark Themes
    monokai: {
        name: 'Dark Baby',
        type: 'dark',
        colors: {
            primary: '#1e1e1eff',
            secondary: '#0f0f0fff',
            tertiary: '#0f0f0fff',
            background: '#000000ff',
            surface: '#1e1e1eff',
            hover: '#1e1e1eff',
            text: '#ffffffff',
            textSecondary: '#7e7e7eff',
            border: '#0f0f0fff',
            accent: '#e2792eff',
            success: '#9bff43ff',
            error: '#ff3d3dff',
            warning: '#ffe53eff',
            info: '#44e0ffff'
        },
        codemirror: 'Dark Baby',
        lightVariant: 'Light Baby'
    },
    
    dracula: {
        name: 'Dracula',
        type: 'dark',
        colors: {
            primary: '#282a36',
            secondary: '#44475a',
            tertiary: '#6272a4',
            background: '#1e1f29',
            surface: '#282a36',
            hover: '#44475a',
            text: '#f8f8f2',
            textSecondary: '#6272a4',
            border: '#44475a',
            accent: '#bd93f9',
            success: '#50fa7b',
            error: '#ff5555',
            warning: '#f1fa8c',
            info: '#8be9fd'
        },
        codemirror: 'dracula',
        lightVariant: 'github'
    },
    
    nord: {
        name: 'Nord',
        type: 'dark',
        colors: {
            primary: '#2E3440',
            secondary: '#3B4252',
            tertiary: '#434C5E',
            background: '#2E3440',
            surface: '#3B4252',
            hover: '#434C5E',
            text: '#ECEFF4',
            textSecondary: '#D8DEE9',
            border: '#4C566A',
            accent: '#88C0D0',
            success: '#A3BE8C',
            error: '#BF616A',
            warning: '#EBCB8B',
            info: '#81A1C1'
        },
        codemirror: 'nord',
        lightVariant: 'light'
    },
    
    oneDark: {
        name: 'One Dark',
        type: 'dark',
        colors: {
            primary: '#282c34',
            secondary: '#21252b',
            tertiary: '#2c313c',
            background: '#1e2127',
            surface: '#282c34',
            hover: '#2c313c',
            text: '#abb2bf',
            textSecondary: '#5c6370',
            border: '#3e4451',
            accent: '#61afef',
            success: '#98c379',
            error: '#e06c75',
            warning: '#e5c07b',
            info: '#56b6c2'
        },
        codemirror: 'material',
        lightVariant: 'light'
    },
    
    tokyoNight: {
        name: 'Tokyo Night',
        type: 'dark',
        colors: {
            primary: '#1a1b26',
            secondary: '#24283b',
            tertiary: '#292e42',
            background: '#16161e',
            surface: '#1a1b26',
            hover: '#24283b',
            text: '#c0caf5',
            textSecondary: '#565f89',
            border: '#292e42',
            accent: '#7aa2f7',
            success: '#9ece6a',
            error: '#f7768e',
            warning: '#e0af68',
            info: '#7dcfff'
        },
        codemirror: 'material',
        lightVariant: 'solarizedLight'
    },
    
    gruvbox: {
        name: 'Gruvbox Dark',
        type: 'dark',
        colors: {
            primary: '#282828',
            secondary: '#3c3836',
            tertiary: '#504945',
            background: '#1d2021',
            surface: '#282828',
            hover: '#3c3836',
            text: '#ebdbb2',
            textSecondary: '#a89984',
            border: '#504945',
            accent: '#fabd2f',
            success: '#b8bb26',
            error: '#fb4934',
            warning: '#fe8019',
            info: '#83a598'
        },
        codemirror: 'material',
        lightVariant: 'solarizedLight'
    },
    
    // Light Themes
    light: {
        name: 'Light Baby',
        type: 'light',
        colors: {
            primary: '#f0ffafff',
            secondary: '#f0ffafff',
            tertiary: '#f0ffafff',
            background: '#f0ffafff',
            surface: '#f0ffafff',
            hover: '#f0ffafff',
            text: '#2c2c2cff',
            textSecondary: '#6b7280',
            border: '#f0ffafff',
            accent: '#74a4f3ff',
            success: '#74a4f3ff',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#06b6d4'
        },
        codemirror: 'Light Baby',
        darkVariant: 'Dark Baby'
    },
    
    solarizedLight: {
        name: 'Solarized Light',
        type: 'light',
        colors: {
            primary: '#fdf6e3',
            secondary: '#eee8d5',
            tertiary: '#93a1a1',
            background: '#fdf6e3',
            surface: '#eee8d5',
            hover: '#93a1a1',
            text: '#657b83',
            textSecondary: '#839496',
            border: '#93a1a1',
            accent: '#268bd2',
            success: '#859900',
            error: '#dc322f',
            warning: '#b58900',
            info: '#2aa198'
        },
        codemirror: 'solarized light',
        darkVariant: 'tokyoNight'
    },
    
    github: {
        name: 'GitHub Light',
        type: 'light',
        colors: {
            primary: '#ffffff',
            secondary: '#f6f8fa',
            tertiary: '#d0d7de',
            background: '#ffffff',
            surface: '#f6f8fa',
            hover: '#eaeef2',
            text: '#24292f',
            textSecondary: '#57606a',
            border: '#d0d7de',
            accent: '#0969da',
            success: '#1a7f37',
            error: '#cf222e',
            warning: '#bf8700',
            info: '#0969da'
        },
        codemirror: 'default',
        darkVariant: 'dracula'
    },
    
    // High Contrast Themes
    highContrast: {
        name: 'High Contrast',
        type: 'dark',
        colors: {
            primary: '#000000',
            secondary: '#1a1a1a',
            tertiary: '#0d0d0d',
            background: '#000000',
            surface: '#1a1a1a',
            hover: '#262626',
            text: '#ffffff',
            textSecondary: '#cccccc',
            border: '#ffffff',
            accent: '#00ff00',
            success: '#00ff00',
            error: '#ff0000',
            warning: '#ffff00',
            info: '#00ffff'
        },
        codemirror: 'monokai',
        lightVariant: 'light'
    },
    
    // Colorful Themes
    cyberpunk: {
        name: 'Cyberpunk',
        type: 'dark',
        colors: {
            primary: '#0a0e27',
            secondary: '#16213e',
            tertiary: '#1a1a2e',
            background: '#000000',
            surface: '#0a0e27',
            hover: '#16213e',
            text: '#00fff9',
            textSecondary: '#00d9ff',
            border: '#ff006e',
            accent: '#ff006e',
            success: '#00ff41',
            error: '#ff0080',
            warning: '#ffbd39',
            info: '#00fff9'
        },
        codemirror: 'monokai',
        lightVariant: 'light'
    },
    
    ocean: {
        name: 'Ocean',
        type: 'dark',
        colors: {
            primary: '#0f1419',
            secondary: '#1a2332',
            tertiary: '#243447',
            background: '#0b0e14',
            surface: '#0f1419',
            hover: '#1a2332',
            text: '#b3b1ad',
            textSecondary: '#565b66',
            border: '#243447',
            accent: '#39bae6',
            success: '#7fd962',
            error: '#f07178',
            warning: '#ffb454',
            info: '#59c2ff'
        },
        codemirror: 'material',
        lightVariant: 'light'
    },
    
    forest: {
        name: 'Forest',
        type: 'dark',
        colors: {
            primary: '#1a2a1a',
            secondary: '#243324',
            tertiary: '#2d3d2d',
            background: '#0f1e0f',
            surface: '#1a2a1a',
            hover: '#243324',
            text: '#d4e4d4',
            textSecondary: '#8fa48f',
            border: '#2d3d2d',
            accent: '#7cb342',
            success: '#8bc34a',
            error: '#f44336',
            warning: '#ffc107',
            info: '#00bcd4'
        },
        codemirror: 'material',
        lightVariant: 'light'
    }
};

// ============================================
// FONT FAMILIES
// ============================================

const FONTS = {
    code: {
        'Fira Code': '"Fira Code", monospace',
        'JetBrains Mono': '"JetBrains Mono", monospace',
        'Cascadia Code': '"Cascadia Code", monospace',
        'Source Code Pro': '"Source Code Pro", monospace',
        'Victor Mono': '"Victor Mono", monospace',
    'Victor Mono Oblique': '"Victor Mono", monospace',
        'Comic Sans MS': '"Comic Sans MS", "Comic Sans", cursive',
        'Consolas': 'Consolas, monospace',
        'Monaco': 'Monaco, monospace',
        'Menlo': 'Menlo, monospace',
        'Ubuntu Mono': '"Ubuntu Mono", monospace',
        'Courier New': '"Courier New", monospace',
        'Roboto Mono': '"Roboto Mono", monospace'
    },
    ui: {
        'System': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        'Inter': '"Inter", sans-serif',
        'Roboto': '"Roboto", sans-serif',
        'Comic Sans MS': '"Comic Sans MS", "Comic Sans", cursive',
        'Open Sans': '"Open Sans", sans-serif',
        'Poppins': '"Poppins", sans-serif',
        'Lato': '"Lato", sans-serif',
        'Montserrat': '"Montserrat", sans-serif',
        'Nunito': '"Nunito", sans-serif',
        'Ubuntu': '"Ubuntu", sans-serif',
        'Arial': 'Arial, sans-serif'
    }
};

// ============================================
// SYNTAX COLOR PALETTES (Font Color Pallet)
// Each palette provides both dark and light variants so it adapts automatically
// based on the current theme.type (dark | light)
// Roles covered: keyword, plain, comment, string, function, number, operator, variable
// ============================================

const PALETTES = {
    default: {
        name: 'Default (Theme Tuned)',
        dark: {
            keyword: '#c678dd',
            plain: '#abb2bf',
            comment: '#5c6370',
            string: '#98c379',
            func: '#61afef',
            builtin: '#61afef',
            number: '#d19a66',
            operator: '#56b6c2',
            variable: '#e06c75'
        },
        light: {
            keyword: '#a626a4',
            plain: '#24292e',
            comment: '#6a737d',
            string: '#22863a',
            func: '#005cc5',
            builtin: '#005cc5',
            number: '#b31d28',
            operator: '#0366d6',
            variable: '#e36209'
        }
    },

    solar: {
        name: 'Solar Pastel',
        dark: {
            keyword: '#ffb86b',
            plain: '#f8f8f2',
            comment: '#6272a4',
            string: '#a6e22e',
            func: '#66d9ef',
            builtin: '#66d9ef',
            number: '#fd971f',
            operator: '#ff79c6',
            variable: '#f8f8f2'
        },
        light: {
            keyword: '#b58900',
            plain: '#073642',
            comment: '#586e75',
            string: '#2aa198',
            func: '#268bd2',
            builtin: '#268bd2',
            number: '#d33682',
            operator: '#859900',
            variable: '#073642'
        }
    },

    neon: {
        name: 'Neon Pop',
        dark: {
            keyword: '#ff6ac1',
            plain: '#e6eef8',
            comment: '#5b6b7a',
            string: '#50fa7b',
            func: '#8be9fd',
            builtin: '#8be9fd',
            number: '#ffd166',
            operator: '#ffad66',
            variable: '#ffd6e8'
        },
        light: {
            keyword: '#d63384',
            plain: '#0b1220',
            comment: '#6c757d',
            string: '#0ca678',
            func: '#0ea5e9',
            builtin: '#0ea5e9',
            number: '#b45309',
            operator: '#0ea5e9',
            variable: '#0b1220'
        }
    },

    muted: {
        name: 'Muted Minimal',
        dark: {
            keyword: '#b77cffff',
            plain: '#ffa280ff',
            comment: '#80bdffff',
            string: '#9bff7dff',
            func: '#ff5387ff',
            builtin: '#ff7b7bff',
            number: '#ffd07aff',
            operator: '#7affe4ff',
            variable: '#ff7b7bff'
        },
        light: {
            keyword: '#6f42c1',
            plain: '#1f2937',
            comment: '#8b97a7',
            string: '#166534',
            func: '#0366d6',
            builtin: '#0366d6',
            number: '#7c2d12',
            operator: '#055160',
            variable: '#7c2d12'
        }
    },

    oceanic: {
        name: 'Oceanic Calm',
        dark: {
            keyword: '#7aa2f7',
            plain: '#c0caf5',
            comment: '#5b6b7a',
            string: '#9ece6a',
            func: '#e0af68',
            builtin: '#e0af68',
            number: '#b48ead',
            operator: '#89ddff',
            variable: '#c792ea'
        },
        light: {
            keyword: '#0b5fff',
            plain: '#102b3d',
            comment: '#476277',
            string: '#0f5132',
            func: '#6b21a8',
            builtin: '#6b21a8',
            number: '#7b2cbf',
            operator: '#0369a1',
            variable: '#102b3d'
        }
    },

    retro: {
        name: 'Retro Terminal',
        dark: {
            keyword: '#ffb86b',
            plain: '#f8f8f2',
            comment: '#9aa5b1',
            string: '#ffd166',
            func: '#ff79c6',
            builtin: '#ff79c6',
            number: '#8be9fd',
            operator: '#a6e22e',
            variable: '#f1fa8c'
        },
        light: {
            keyword: '#b45500',
            plain: '#1f1f1f',
            comment: '#7a7a7a',
            string: '#8a5a00',
            func: '#9d4edd',
            builtin: '#9d4edd',
            number: '#4c1d95',
            operator: '#b31d28',
            variable: '#1f1f1f'
        }
    },

    pastel: {
        name: 'Pastel Soft',
        dark: {
            keyword: '#ff9aa2',
            plain: '#f7f7ff',
            comment: '#a0aec0',
            string: '#ffdac1',
            func: '#b5e4ff',
            builtin: '#b5e4ff',
            number: '#c7ceea',
            operator: '#c3f0ca',
            variable: '#ffd6e8'
        },
        light: {
            keyword: '#ef476f',
            plain: '#05204a',
            comment: '#6c7a89',
            string: '#ff9f1c',
            func: '#2ec4b6',
            builtin: '#2ec4b6',
            number: '#ffd166',
            operator: '#06d6a0',
            variable: '#05204a'
        }
    },

    elegant: {
        name: 'Elegant Contrast',
        dark: {
            keyword: '#e6b89c',
            plain: '#f6f3ee',
            comment: '#9aa5b1',
            string: '#b6e3a5',
            func: '#8fd3ff',
            builtin: '#8fd3ff',
            number: '#ffd6a5',
            operator: '#d6cdea',
            variable: '#ffd6e5'
        },
        light: {
            keyword: '#874bff',
            plain: '#1a1a1a',
            comment: '#7b7b7b',
            string: '#15803d',
            func: '#0ea5e9',
            builtin: '#0ea5e9',
            number: '#b45309',
            operator: '#6b7280',
            variable: '#1a1a1a'
        }
    },

    highviz: {
        name: 'High Viz',
        dark: {
            keyword: '#ffd166',
            plain: '#ffffff',
            comment: '#7f8c8d',
            string: '#2ecc71',
            func: '#3498db',
            builtin: '#3498db',
            number: '#f39c12',
            operator: '#e74c3c',
            variable: '#ecf0f1'
        },
        light: {
            keyword: '#b93b8f',
            plain: '#111827',
            comment: '#6b7280',
            string: '#065f46',
            func: '#0b5fff',
            builtin: '#0b5fff',
            number: '#a16207',
            operator: '#991b1b',
            variable: '#111827'
        }
    }
};

// ============================================
// THEME MANAGER CLASS
// ============================================

class ThemeManager {
    constructor() {
        this.currentTheme = 'monokai';
        this.currentPalette = 'default';
        this.accentColor = null;
        this.glassmorphism = false;
        this.codeFont = 'Fira Code';
        this.uiFont = 'System';
        // Per-panel font sizes (can be different from code font size)
        this.codeFontSize = null;
        this.uiFontSize = null;
        this.outputFontSize = null;
        this.replFontSize = null;
        this.varsFontSize = null;
        this.settings = this.loadSettings();
        this.init();
    }

    init() {
        this.applySettings();
        this.createStyleElement();
        this.applyTheme(this.currentTheme);
        
        if (this.accentColor) {
            this.applyAccentColor(this.accentColor);
        }
        
        if (this.glassmorphism) {
            this.applyGlassmorphism(true);
        }
    }

    // ============================================
    // PALETTE METHODS
    // ============================================
    applyPalette(paletteId) {
        if (!PALETTES[paletteId]) return;
        this.currentPalette = paletteId;
        const root = document.documentElement;
        // pick variant based on theme type
        const variant = THEMES[this.currentTheme] && THEMES[this.currentTheme].type === 'light' ? 'light' : 'dark';
        const colors = PALETTES[paletteId][variant] || PALETTES[paletteId].dark;

        // set CSS variables for syntax roles
        root.style.setProperty('--syntax-keyword', colors.keyword);
        root.style.setProperty('--syntax-plain', colors.plain);
        root.style.setProperty('--syntax-comment', colors.comment);
        root.style.setProperty('--syntax-string', colors.string);
        root.style.setProperty('--syntax-func', colors.func);
        root.style.setProperty('--syntax-number', colors.number);
        root.style.setProperty('--syntax-operator', colors.operator);
        root.style.setProperty('--syntax-variable', colors.variable);
    // new builtin function color
    if (colors.builtin) root.style.setProperty('--syntax-builtin', colors.builtin);

        this.saveSettings();
        this.updateDynamicStyles();
        // Also push palette colors into existing editors (if any)
        try { this.applyPaletteToEditor(); } catch (e) {}
    }

    applyPaletteToEditor() {
        // If CodeMirror instance exists, set CSS variables on its wrapper so token selectors pick them up
        try {
            const root = document.documentElement;
            const editors = [];
            if (window.AppState && window.AppState.editor) editors.push(window.AppState.editor);
            if (window.editor) editors.push(window.editor);

            editors.forEach(ed => {
                try {
                    const wrapper = ed.getWrapperElement ? ed.getWrapperElement() : null;
                    if (wrapper) {
                        wrapper.style.setProperty('--syntax-keyword', getComputedStyle(root).getPropertyValue('--syntax-keyword') || '');
                        wrapper.style.setProperty('--syntax-plain', getComputedStyle(root).getPropertyValue('--syntax-plain') || '');
                        wrapper.style.setProperty('--syntax-comment', getComputedStyle(root).getPropertyValue('--syntax-comment') || '');
                        wrapper.style.setProperty('--syntax-string', getComputedStyle(root).getPropertyValue('--syntax-string') || '');
                        wrapper.style.setProperty('--syntax-func', getComputedStyle(root).getPropertyValue('--syntax-func') || '');
                        wrapper.style.setProperty('--syntax-number', getComputedStyle(root).getPropertyValue('--syntax-number') || '');
                        wrapper.style.setProperty('--syntax-operator', getComputedStyle(root).getPropertyValue('--syntax-operator') || '');
                        wrapper.style.setProperty('--syntax-variable', getComputedStyle(root).getPropertyValue('--syntax-variable') || '');
                    }
                    // re-render/refresh editor to ensure new styles take effect
                    if (ed && typeof ed.refresh === 'function') ed.refresh();
                } catch (e) {}
            });
        } catch (e) {}
    }

    getAvailablePalettes() {
        return Object.entries(PALETTES).map(([id, p]) => ({ id, name: p.name }));
    }

    createStyleElement() {
        if (!document.getElementById('dynamic-theme-styles')) {
            const style = document.createElement('style');
            style.id = 'dynamic-theme-styles';
            document.head.appendChild(style);
        }
    }

    loadSettings() {
        const saved = localStorage.getItem('pyinter-settings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.currentTheme = settings.theme || 'monokai';
            this.accentColor = settings.accentColor || null;
            this.glassmorphism = settings.glassmorphism || false;
            this.codeFont = settings.codeFont || 'Fira Code';
            this.uiFont = settings.uiFont || 'System';
            this.currentPalette = settings.palette || this.currentPalette;
            return settings;
        }
        return {
            theme: 'monokai',
            accentColor: null,
            glassmorphism: false,
            codeFont: 'Fira Code',
            uiFont: 'System',
            soundEffects: false
        };
    }

    saveSettings() {
        const settings = {
            theme: this.currentTheme,
            accentColor: this.accentColor,
            glassmorphism: this.glassmorphism,
            codeFont: this.codeFont,
            uiFont: this.uiFont,
            palette: this.currentPalette || 'default',
            codeFontSize: this.codeFontSize || '14px',
            uiFontSize: this.uiFontSize || '14px',
            outputFontSize: this.outputFontSize || this.codeFontSize || '14px',
            replFontSize: this.replFontSize || this.codeFontSize || '14px',
            varsFontSize: this.varsFontSize || this.codeFontSize || '14px',
            soundEffects: this.settings.soundEffects || false
        };
        localStorage.setItem('pyinter-settings', JSON.stringify(settings));
        this.settings = settings;
    }

    applySettings() {
        // Apply saved settings
        if (this.settings.theme) {
            this.currentTheme = this.settings.theme;
        }
        if (this.settings.accentColor) {
            this.accentColor = this.settings.accentColor;
        }
        if (this.settings.glassmorphism) {
            this.glassmorphism = this.settings.glassmorphism;
        }
        if (this.settings.codeFont) {
            this.codeFont = this.settings.codeFont;
        }
        if (this.settings.uiFont) {
            this.uiFont = this.settings.uiFont;
        }
        if (this.settings.codeFontSize) {
            this.codeFontSize = this.settings.codeFontSize;
            document.documentElement.style.setProperty('--font-size-code', this.codeFontSize);
        }
        if (this.settings.uiFontSize) {
            this.uiFontSize = this.settings.uiFontSize;
            document.documentElement.style.setProperty('--font-size-ui', this.uiFontSize);
        }
        // Per-panel sizes: fall back to code font size if not specified
        if (this.settings.outputFontSize) {
            this.outputFontSize = this.settings.outputFontSize;
        } else {
            this.outputFontSize = this.codeFontSize || '14px';
        }
        document.documentElement.style.setProperty('--font-size-output', this.outputFontSize);

        if (this.settings.replFontSize) {
            this.replFontSize = this.settings.replFontSize;
        } else {
            this.replFontSize = this.codeFontSize || '14px';
        }
        document.documentElement.style.setProperty('--font-size-repl', this.replFontSize);

        if (this.settings.varsFontSize) {
            this.varsFontSize = this.settings.varsFontSize;
        } else {
            this.varsFontSize = this.codeFontSize || '14px';
        }
        document.documentElement.style.setProperty('--font-size-vars', this.varsFontSize);
    }

    applyTheme(themeName) {
        const theme = THEMES[themeName];
        if (!theme) return;

        this.currentTheme = themeName;
        const root = document.documentElement;

        // Apply theme colors as CSS variables
        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(`--theme-${key}`, value);
        });

        // Set data-theme attribute
        root.setAttribute('data-theme', theme.type);

        // Apply CodeMirror theme if editor exists
        if (window.AppState && window.AppState.editor && theme.codemirror) {
            window.AppState.editor.setOption('theme', theme.codemirror);
        } else if (window.editor && theme.codemirror) {
            window.editor.setOption('theme', theme.codemirror);
        }

        // Update body background
        document.body.style.background = theme.colors.background;
        document.body.style.color = theme.colors.text;

        // Also apply inline surface styles to critical UI chrome so they
        // update even if other stylesheets override CSS variables.
        try {
            this.setAppSurfaceColors(theme.colors);
        } catch (e) { /* ignore if DOM not ready */ }

        // Force CodeMirror to match UI colors
        this.applyCodeMirrorColors(theme.colors);
        // Ensure palette colors are applied (respecting dark/light variant)
        if (this.currentPalette) {
            try { this.applyPalette(this.currentPalette); } catch (e) {}
        }
        // Always prefer the theme's accent color first when applying a theme.
        // The user can still override the accent afterwards; selecting a theme
        // will set the accent to the theme's built-in accent color by default.
        try {
            const themeAccent = (theme.colors && theme.colors.accent) ? theme.colors.accent : null;
            console.debug('applyTheme()', { theme: themeName, themeAccent: themeAccent, previousAccent: this.accentColor });

            if (themeAccent) {
                // applyAccentColor will persist settings and update dynamic styles
                this.applyAccentColor(themeAccent);
            } else {
                this.saveSettings();
                this.updateDynamicStyles();
            }
        } catch (e) {
            console.warn('applyTheme: failed to apply theme accent or update styles', e);
            this.saveSettings();
            this.updateDynamicStyles();
        }
    }

    // Apply inline styles to critical UI surfaces (nav/status/buttons)
    // This serves as a robust fallback when external CSS rules remain
    // more specific than the dynamic stylesheet or use !important.
    setAppSurfaceColors(colors) {
        if (!colors) return;
        // navbar and status bar
        const navs = document.querySelectorAll('.top-navbar');
        navs.forEach(n => {
            try {
                const bg = colors.secondary || colors.surface || '';
                const txt = colors.text || '';
                n.style.setProperty('background', bg, 'important');
                n.style.setProperty('color', txt, 'important');
                // enforce no borders/lines on navbar
                n.style.setProperty('border', 'none', 'important');
                n.style.setProperty('border-bottom', 'none', 'important');
                n.style.setProperty('outline', 'none', 'important');
            } catch (e) {}
        });

        const statuses = document.querySelectorAll('.status-bar');
        statuses.forEach(s => {
            try {
                const bg = colors.secondary || colors.surface || '';
                const txt = colors.text || '';
                s.style.setProperty('background', bg, 'important');
                s.style.setProperty('color', txt, 'important');
                // enforce no borders/lines on status bar
                s.style.setProperty('border', 'none', 'important');
                s.style.setProperty('border-top', 'none', 'important');
                s.style.setProperty('outline', 'none', 'important');
            } catch (e) {}
        });

        // Theme toggle / accent buttons
        const toggles = document.querySelectorAll('.theme-toggle, .btn-primary, .run-btn');
        toggles.forEach(t => {
            try {
                const bg = colors.accent || '';
                const border = colors.accent || '';
                const txt = colors.text || '';
                t.style.setProperty('background', bg, 'important');
                // remove visible borders for flat look
                t.style.setProperty('border', 'none', 'important');
                t.style.setProperty('color', txt, 'important');
            } catch (e) {}
        });

        // Ensure tab-bar and panel headers are borderless
        const tabbars = document.querySelectorAll('.tab-bar');
        tabbars.forEach(tb => {
            try {
                tb.style.setProperty('background', colors.tertiary || colors.surface || '', 'important');
                tb.style.setProperty('border', 'none', 'important');
                tb.style.setProperty('border-bottom', 'none', 'important');
                tb.style.setProperty('outline', 'none', 'important');
            } catch (e) {}
        });

        const headers = document.querySelectorAll('.panel-header');
        headers.forEach(h => {
            try {
                h.style.setProperty('background', colors.tertiary || colors.surface || '', 'important');
                h.style.setProperty('border', 'none', 'important');
                h.style.setProperty('border-bottom', 'none', 'important');
                h.style.setProperty('outline', 'none', 'important');
            } catch (e) {}
        });
    }

    applyCodeMirrorColors(colors) {
        // Apply UI theme colors to CodeMirror wrapper
        const cmElements = document.querySelectorAll('.CodeMirror');
        cmElements.forEach(cm => {
            // Use unified panel background so editor matches other panels
            cm.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--panel-bg') || colors.primary;
            cm.style.color = colors.text;
            
            // Apply to gutters - add a class instead of setting inline styles
            // so CSS can control appearance without being overridden by inline rules
            const gutters = cm.querySelectorAll('.CodeMirror-gutters');
            gutters.forEach(gutter => {
                gutter.classList.add('cm-gutters-themed');
            });
            
            // Apply to line numbers
            const lineNumbers = cm.querySelectorAll('.CodeMirror-linenumber');
            lineNumbers.forEach(ln => {
                ln.style.color = colors.textSecondary;
            });
            
            // Apply to cursor
            const cursors = cm.querySelectorAll('.CodeMirror-cursor');
            cursors.forEach(cursor => {
                cursor.style.borderLeftColor = colors.text;
            });
            
            // Apply to selected text
            const selected = cm.querySelectorAll('.CodeMirror-selected');
            selected.forEach(sel => {
                sel.style.background = getComputedStyle(document.documentElement).getPropertyValue('--theme-tertiary') || colors.tertiary;
            });
        });
    }

    toggleThemeMode() {
        const currentTheme = THEMES[this.currentTheme];
        if (!currentTheme) return;

        // Switch between dark and light variant
        let targetTheme;
        if (currentTheme.type === 'dark' && currentTheme.lightVariant) {
            targetTheme = currentTheme.lightVariant;
        } else if (currentTheme.type === 'light' && currentTheme.darkVariant) {
            targetTheme = currentTheme.darkVariant;
        }

        if (targetTheme && THEMES[targetTheme]) {
            this.applyTheme(targetTheme);
        }
    }

    applyAccentColor(color) {
        this.accentColor = color;
        const root = document.documentElement;
        
        // Override accent color
        root.style.setProperty('--theme-accent', color);
        root.style.setProperty('--accent-primary', color);
        
        // Generate lighter/darker variants
        const rgb = this.hexToRgb(color);
        if (rgb) {
            const lighter = this.adjustColor(rgb, 20);
            const darker = this.adjustColor(rgb, -20);
            root.style.setProperty('--accent-hover', darker);
            root.style.setProperty('--accent-light', lighter);
        }

        this.saveSettings();
        this.updateDynamicStyles();
        // Also attempt to update inline surface colors so accent changes are visible
        try { this.setAppSurfaceColors({ accent: color }); } catch (e) { }
    }

    applyGlassmorphism(enabled) {
        this.glassmorphism = enabled;
        const root = document.documentElement;
        
        if (enabled) {
            root.classList.add('glassmorphism-enabled');
        } else {
            root.classList.remove('glassmorphism-enabled');
        }

        this.saveSettings();
        this.updateDynamicStyles();
    }

    applyCodeFont(fontName) {
        this.codeFont = fontName;
        const fontFamily = FONTS.code[fontName];
        
        document.documentElement.style.setProperty('--font-code', fontFamily);
        // Also set an output-font variable so output uses same family by default
        document.documentElement.style.setProperty('--font-output', fontFamily);
        
        // Apply to CodeMirror
        if (window.editor) {
            const cmElement = window.editor.getWrapperElement();
            cmElement.style.fontFamily = fontFamily;
        }

        // Also apply code font to output / console elements so output matches editor
        try {
            const outputEls = document.querySelectorAll('.code-editor, .output-container, #output, .output-content, .repl-output, .repl-output-line, .output-dataframe');
            outputEls.forEach(el => {
                el.style.fontFamily = fontFamily;
            });
        } catch (e) {
            // DOM may not be ready or elements absent; ignore
        }

        this.saveSettings();
    }

    applyUIFont(fontName) {
        this.uiFont = fontName;
        const fontFamily = FONTS.ui[fontName];
        
        document.documentElement.style.setProperty('--font-ui', fontFamily);
        document.body.style.fontFamily = fontFamily;

        this.saveSettings();
    }

    applyCodeFontSize(size) {
        this.codeFontSize = size;
        document.documentElement.style.setProperty('--font-size-code', size);
        
        // Refresh CodeMirror
        if (window.editor) {
            window.editor.refresh();
        }
        
        this.saveSettings();
    }

    applyUIFontSize(size) {
        this.uiFontSize = size;
        document.documentElement.style.setProperty('--font-size-ui', size);
        this.saveSettings();
    }

    updateDynamicStyles() {
        const style = document.getElementById('dynamic-theme-styles');
        // Note: per-panel font sizes are now controlled via CSS variables

        const theme = THEMES[this.currentTheme];
        if (!theme) return;

        // Only emit per-panel CSS variables if explicitly configured. This avoids
        // overriding inline/root styles that may have been set by user interactions
        // (e.g. middle-wheel adjustments). Always emit code font/size.
        let css = `
            /* Dynamic Theme Styles */
            :root {
                --font-code: ${this.codeFont ? FONTS.code[this.codeFont] : '"Fira Code", monospace'};
                --font-size-code: ${this.codeFontSize || '14px'};
                ${this.outputFontSize ? `--font-size-output: ${this.outputFontSize};` : ''}
                ${this.replFontSize ? `--font-size-repl: ${this.replFontSize};` : ''}
                ${this.varsFontSize ? `--font-size-vars: ${this.varsFontSize};` : ''}
                ${this.codeFont ? `--font-output: ${FONTS.code[this.codeFont]};` : ''}
                --bg-primary: var(--theme-primary);
                --bg-secondary: var(--theme-secondary);
                --bg-tertiary: var(--theme-tertiary);
                --bg-elevated: var(--theme-hover);
                /* Unified panel background so all main panels match */
                --panel-bg: var(--theme-surface);
                /* Gutter default + accent on hover/drag */
                --gutter-default: rgba(128,128,128,0.28);
                --gutter-accent: var(--theme-accent);
                --text-primary: var(--theme-text);
                --text-secondary: var(--theme-textSecondary);
                --border-color: var(--theme-border);
                --accent-primary: var(--theme-accent);
                --accent-success: var(--theme-success);
                --accent-error: var(--theme-error);
                --accent-warning: var(--theme-warning);
                --accent-info: var(--theme-info);
            }

            /* High-specificity app-scoped overrides so themes control every major UI surface */
            #app, #app * {
                /* Ensure the app root inherits the unified colors */
                color: var(--text-primary) !important;
                background-color: transparent !important;
            }

            /* Top navigation, status bar, and main structural panels */
            #app .top-navbar,
            #app .status-bar,
            #app .tab-bar,
            #app .panel-header,
            #app .left-panel,
            #app .right-panel,
            #app .container,
            #app .panel,
            #app .split-panel,
            #app .main-container,
            #app .code-editor,
            #app .output-container,
            #app .variables-container,
            #app .repl-wrapper,
            #app .modal-content {
                background: var(--panel-bg) !important;
                color: var(--text-primary) !important;
                border-color: var(--border-color) !important;
                box-shadow: none !important;
            }

            /* Navbar and status bar should use the theme secondary surface (slightly different tone)
               but visually remain flat (no dividing lines) */
            #app .top-navbar,
            #app .status-bar {
                background: var(--theme-secondary) !important;
                color: var(--text-primary) !important;
                border-bottom: none !important;
                border-top: none !important;
            }

            /* Tab bar and panel headers get a distinct elevated tone but remain borderless */
            #app .tab-bar,
            #app .panel-header {
                background: var(--theme-tertiary) !important;
                border-bottom: none !important;
                color: var(--text-primary) !important;
            }

            /* Buttons, controls and nav items should respect accent/border variables but use flat styling */
            #app .nav-btn,
            #app .nav-controls .nav-btn,
            #app .btn-primary,
            #app .run-btn,
            #app .icon-btn {
                background: var(--panel-bg) !important;
                color: var(--text-primary) !important;
                border: none !important;
            }

            /* Accent colored controls */
            #app .theme-toggle,
            #app .btn-primary,
            #app .run-btn {
                background: var(--theme-accent) !important;
                border-color: var(--theme-accent) !important;
                color: var(--text-primary) !important;
            }

            /* Split gutters and resize handles: default grey, accent on hover/drag */
            #app .gutter,
            #app .custom-resizer {
                background: var(--gutter-default) !important;
                border-color: transparent !important;
            }
            #app .gutter:hover,
            #app .gutter.gutter-dragging,
            #app .custom-resizer:hover {
                background: var(--gutter-accent) !important;
                border-color: var(--gutter-accent) !important;
            }

            /* CodeMirror gutters / line numbers align with theme */
            #app .CodeMirror-gutters,
            #app .CodeMirror-linenumber,
            #app .cm-gutters-themed {
                background: var(--panel-bg) !important;
                color: var(--text-secondary) !important;
                border-right: var(--divider-width) solid var(--border-color) !important;
            }

            /* Ensure modal and toasts follow theme surfaces */
            #app .modal-content,
            #app .toast {
                background: var(--theme-surface) !important;
                color: var(--text-primary) !important;
                border: var(--divider-width) solid var(--border-color) !important;
            }

            /* Apply theme colors to all components */
            /* Ensure all primary panels use the same background color */
            .container,
            .panel,
            .split-panel,
            .left-panel,
            .right-panel,
            .code-editor,
            .output-console,
            .variables-container,
            .variables-content,
            #output,
            .repl-output,
            .output-content,
            .CodeMirror {
                background: var(--panel-bg) !important;
                color: var(--theme-text) !important;
            }

            .panel-header,
            .top-navbar,
            .status-bar {
                background: var(--theme-secondary) !important;
                border-color: var(--theme-border) !important;
                color: var(--theme-text) !important;
            }

            /* Specific components that previously used primary now follow panel-bg to remain consistent */
            textarea#codeEditor {
                background: var(--panel-bg) !important;
                color: var(--theme-text) !important;
            }

            /* Code editor uses code font/size */
            textarea#codeEditor, .CodeMirror {
                font-family: var(--font-code) !important;
                font-size: var(--font-size-code) !important;
            }

            /* Output uses its own font-size and may use output font-family */
            .output-console, .output-content, #output, .output-dataframe {
                font-family: var(--font-output) !important;
                font-size: var(--font-size-output) !important;
                color: var(--theme-text) !important;
            }

            /* REPL lines use repl font-size */
            .repl-output, .repl-output-line {
                font-family: var(--font-output) !important;
                font-size: var(--font-size-repl) !important;
            }

            /* Variables / inspector uses its own font size */
            .variables-content, .variables-list {
                font-size: var(--font-size-vars) !important;
                font-family: var(--font-output) !important;
            }

            /* Ensure panel titles remain slightly larger and bolder */
            .panel-title {
                font-weight: 700 !important;
                font-size: 15px !important;
            }

            .btn-primary,
            .run-btn {
                background: var(--theme-accent) !important;
                border-color: var(--theme-accent) !important;
            }

            .btn-secondary,
            .icon-btn {
                background: var(--theme-tertiary) !important;
                color: var(--theme-text) !important;
                border-color: var(--theme-border) !important;
            }

            .variable-item,
            .history-item,
            .example-btn {
                background: var(--theme-tertiary) !important;
                border-color: var(--theme-border) !important;
                color: var(--theme-text) !important;
            }

            .modal-content {
                background: var(--theme-surface) !important;
                color: var(--theme-text) !important;
                border-color: var(--theme-border) !important;
            }

            input, select, textarea {
                background: var(--theme-secondary) !important;
                color: var(--theme-text) !important;
                border-color: var(--theme-border) !important;
            }

            /* Accent color highlights */
            .status-ready,
            .repl-prompt,
            .variable-name,
            a,
            .nav-btn:hover {
                color: var(--theme-accent) !important;
            }

            .output-success,
            .repl-output-line {
                color: var(--theme-success) !important;
            }

            /* Ensure plain output text and REPL lines use code font and preserve whitespace */
            .output-content, #output, .output-dataframe {
                white-space: pre-wrap;
            }

            .output-error,
            .repl-error-line {
                color: var(--theme-error) !important;
            }

                /* Syntax highlighting variables (can be overridden by palettes) */
                /* Base token classes */
                .cm-syntax-keyword, .cm-keyword, .token.keyword { color: var(--syntax-keyword, var(--theme-accent)) !important; }
                .cm-syntax-plain, .cm-plain, .token.plain { color: var(--syntax-plain, var(--theme-text)) !important; }
                .cm-syntax-comment, .cm-comment, .token.comment { color: var(--syntax-comment, var(--theme-textSecondary)) !important; font-style: italic; }
                .cm-syntax-string, .cm-string, .token.string { color: var(--syntax-string, #98c379) !important; }
                .cm-syntax-func, .cm-def, .token.function { color: var(--syntax-func, var(--theme-accent)) !important; }
                .cm-syntax-number, .cm-number, .token.number { color: var(--syntax-number, #d19a66) !important; }
                .cm-syntax-operator, .cm-operator, .token.operator { color: var(--syntax-operator, var(--theme-accent)) !important; }
                .cm-syntax-variable, .cm-variable, .token.variable { color: var(--syntax-variable, var(--theme-text)) !important; }

                /* Stronger selectors specifically targeting CodeMirror token spans so palette variables win
                    over theme CSS that uses .cm-s-THEME .cm-keyword specificity. We include several selector
                    patterns and use !important to ensure the palette colors apply. */
                .CodeMirror .cm-keyword, .CodeMirror pre span.cm-keyword, .CodeMirror[class*="cm-s-"] .cm-keyword { color: var(--syntax-keyword) !important; }
                .CodeMirror .cm-atom, .CodeMirror .cm-number, .CodeMirror pre span.cm-number, .CodeMirror[class*="cm-s-"] .cm-number { color: var(--syntax-number) !important; }
                .CodeMirror .cm-def, .CodeMirror pre span.cm-def, .CodeMirror[class*="cm-s-"] .cm-def { color: var(--syntax-func) !important; }
                .CodeMirror .cm-variable, .CodeMirror pre span.cm-variable, .CodeMirror[class*="cm-s-"] .cm-variable { color: var(--syntax-variable) !important; }
                .CodeMirror .cm-string, .CodeMirror pre span.cm-string, .CodeMirror[class*="cm-s-"] .cm-string { color: var(--syntax-string) !important; }
                .CodeMirror .cm-comment, .CodeMirror pre span.cm-comment, .CodeMirror[class*="cm-s-"] .cm-comment { color: var(--syntax-comment) !important; font-style: italic; }
                .CodeMirror .cm-operator, .CodeMirror pre span.cm-operator, .CodeMirror[class*="cm-s-"] .cm-operator { color: var(--syntax-operator) !important; }
                .CodeMirror .cm-variable-2, .CodeMirror pre span.cm-variable-2, .CodeMirror[class*="cm-s-"] .cm-variable-2 { color: var(--syntax-variable) !important; }
                /* Built-in functions (e.g., print, len) - style via --syntax-builtin */
                .CodeMirror .cm-builtin, .CodeMirror pre span.cm-builtin, .CodeMirror[class*="cm-s-"] .cm-builtin { color: var(--syntax-builtin) !important; }

            /* Make CodeMirror gutter / line index match panel background so indexes don't show different color */
            .CodeMirror-gutters,
            .CodeMirror-gutter,
            .cm-gutters-themed,
            .CodeMirror-gutters * {
                background: var(--panel-bg) !important;
                color: var(--text-secondary) !important;
                border-right: 1px solid var(--border-color) !important;
            }

            .CodeMirror-linenumber {
                background: transparent !important;
                color: var(--text-secondary) !important;
            }

            /* Enforce borderless editor visuals across themes */
            .code-editor,
            .CodeMirror,
            textarea#codeEditor,
            .CodeMirror-scroll,
            .CodeMirror-sizer {
                background: var(--panel-bg) !important;
                color: var(--theme-text) !important;
                border: none !important;
                border-radius: 0 !important;
                box-shadow: none !important;
                outline: none !important;
            }

            /* Remove gutter separators entirely so there are no visible lines */
            .CodeMirror-gutters,
            .CodeMirror-gutter {
                background: transparent !important;
                border-right: none !important;
            }

            .CodeMirror .CodeMirror-activeline,
            .CodeMirror .CodeMirror-activeline-background {
                background: transparent !important;
            }
        `;

        // Add glassmorphism styles
        if (this.glassmorphism) {
            css += `
                .glassmorphism-enabled .panel,
                .glassmorphism-enabled .modal-content,
                .glassmorphism-enabled .panel-header,
                .glassmorphism-enabled .top-navbar,
                .glassmorphism-enabled .output-console,
                .glassmorphism-enabled .variable-item {
                    background: rgba(${this.hexToRgb(theme.colors.surface)?.r || 30}, 
                                   ${this.hexToRgb(theme.colors.surface)?.g || 30}, 
                                   ${this.hexToRgb(theme.colors.surface)?.b || 30}, 0.7) !important;
                    backdrop-filter: blur(10px) saturate(180%);
                    -webkit-backdrop-filter: blur(10px) saturate(180%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .glassmorphism-enabled .container {
                    background: rgba(${this.hexToRgb(theme.colors.primary)?.r || 30}, 
                                   ${this.hexToRgb(theme.colors.primary)?.g || 30}, 
                                   ${this.hexToRgb(theme.colors.primary)?.b || 30}, 0.8) !important;
                    backdrop-filter: blur(20px) saturate(180%);
                    -webkit-backdrop-filter: blur(20px) saturate(180%);
                }
            `;
        }

        style.textContent = css;

        // Inline fallback: create a robust enforcement function that runs immediately,
        // after load, after a short timeout, and observes DOM mutations so the
        // output panel remains borderless even if elements are re-created.
        (function() {
            const setNone = (el) => {
                if (!el || !el.style) return;
                try {
                    el.style.setProperty('border', 'none', 'important');
                    el.style.setProperty('border-top', 'none', 'important');
                    el.style.setProperty('border-right', 'none', 'important');
                    el.style.setProperty('border-bottom', 'none', 'important');
                    el.style.setProperty('border-left', 'none', 'important');
                    el.style.setProperty('box-shadow', 'none', 'important');
                    el.style.setProperty('outline', 'none', 'important');
                    el.style.setProperty('background', 'var(--panel-bg)', 'important');
                } catch (e) {
                    // ignore failures for detached nodes
                }
            };

            const enforceNoBorders = () => {
                try {
                    const targets = document.querySelectorAll('.output-container, .output-console, .output-container > .panel-header, .output-console > .panel-header, .panel-header');
                    const parents = document.querySelectorAll('.right-panel, .split-panel, .main-container, #app');
                    targets.forEach(el => setNone(el));
                    parents.forEach(el => setNone(el));

                    document.querySelectorAll('.CodeMirror-gutters, .CodeMirror-gutter').forEach(g => {
                        if (!g || !g.style) return;
                        try {
                            g.style.setProperty('background', 'transparent', 'important');
                            g.style.setProperty('border', 'none', 'important');
                            g.style.setProperty('border-right', 'none', 'important');
                            g.style.setProperty('box-shadow', 'none', 'important');
                        } catch (e) {}
                    });
                    // Gutter (split) handles: default grey, accent on hover/drag
                    document.querySelectorAll('.gutter, .custom-resizer').forEach(g => {
                        if (!g || !g.style) return;
                        try {
                            // Remove inline background so stylesheet hover/drag rules can win
                            g.style.removeProperty('background');
                            g.style.removeProperty('background-color');
                            g.style.setProperty('border', 'none', 'important');
                        } catch (e) {}
                    });
                } catch (e) {
                    // silent
                }
            };

            // Run immediately
            enforceNoBorders();

            // Run after load and after a short timeout to catch delayed DOM builds
            window.addEventListener('load', enforceNoBorders);
            setTimeout(enforceNoBorders, 180);

            // Observe DOM mutations and re-apply enforcement when panels are added/changed
            try {
                const observer = new MutationObserver((mutations) => {
                    for (const m of mutations) {
                        if (m.addedNodes && m.addedNodes.length) {
                            enforceNoBorders();
                            break;
                        }
                    }
                });
                observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
            } catch (e) {
                // ignore if MutationObserver not available
            }
        })();
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    adjustColor(rgb, amount) {
        return '#' + [rgb.r, rgb.g, rgb.b].map(c => {
            const adjusted = Math.max(0, Math.min(255, c + amount));
            return adjusted.toString(16).padStart(2, '0');
        }).join('');
    }

    getAvailableThemes() {
        return Object.entries(THEMES).map(([key, theme]) => ({
            id: key,
            name: theme.name,
            type: theme.type
        }));
    }

    getAvailableFonts() {
        return {
            code: Object.keys(FONTS.code),
            ui: Object.keys(FONTS.ui)
        };
    }
}

// ============================================
// KEYBOARD SOUND EFFECTS
// ============================================

class KeyboardSounds {
    constructor() {
        this.enabled = false;
        this.audioContext = null;
        this.audioBuffer = null;
        this.loadSettings();
        this.loadAudioFile();
    }

    loadSettings() {
        const saved = localStorage.getItem('pyinter-settings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.enabled = settings.soundEffects || false;
        }
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    async loadAudioFile() {
        try {
            this.init();
            const response = await fetch('/static/single-key-press-393908.mp3');
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            console.log('✅ Keyboard sound loaded successfully');
        } catch (error) {
            console.warn('⚠️ Could not load keyboard sound file, using fallback:', error);
            this.audioBuffer = null;
        }
    }

    playKeySound() {
        if (!this.enabled) return;

        if (this.audioBuffer) {
            // Play the actual audio file
            this.playAudioFile();
        } else {
            // Fallback to synthesized sound
            this.playSynthesizedSound();
        }
    }

    playAudioFile() {
        if (!this.audioContext || !this.audioBuffer) return;

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = this.audioBuffer;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Random volume variation for natural feel
        gainNode.gain.value = 0.3 + Math.random() * 0.2; // 0.3-0.5

        source.start(0);
    }

    playSynthesizedSound() {
        if (!this.audioContext) {
            this.init();
        }

        const currentTime = this.audioContext.currentTime;
        
        // Create multiple oscillators for richer mechanical keyboard sound
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const oscillator3 = this.audioContext.createOscillator();
        
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        // Connect audio nodes
        oscillator1.connect(filter);
        oscillator2.connect(filter);
        oscillator3.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Realistic mechanical keyboard frequencies
        oscillator1.frequency.value = 1200 + Math.random() * 300;
        oscillator1.type = 'square';
        
        oscillator2.frequency.value = 400 + Math.random() * 200;
        oscillator2.type = 'sine';
        
        oscillator3.frequency.value = 80 + Math.random() * 40;
        oscillator3.type = 'triangle';

        filter.type = 'lowpass';
        filter.frequency.value = 2000 + Math.random() * 500;
        filter.Q.value = 1;

        const attackTime = 0.001;
        const releaseTime = 0.03;
        const peakVolume = 0.08 + Math.random() * 0.02;

        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(peakVolume, currentTime + attackTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + releaseTime);

        oscillator1.start(currentTime);
        oscillator2.start(currentTime);
        oscillator3.start(currentTime);
        
        oscillator1.stop(currentTime + releaseTime);
        oscillator2.stop(currentTime + releaseTime);
        oscillator3.stop(currentTime + releaseTime);
    }

    toggle(enabled) {
        this.enabled = enabled;
        
        if (enabled && !this.audioContext) {
            this.init();
            this.loadAudioFile();
        }

        const settings = JSON.parse(localStorage.getItem('pyinter-settings') || '{}');
        settings.soundEffects = enabled;
        localStorage.setItem('pyinter-settings', JSON.stringify(settings));
    }

    playSuccessSound() {
        if (!this.enabled) return;
        
        if (!this.audioContext) {
            this.init();
        }

        const currentTime = this.audioContext.currentTime;
        
        // Create a pleasant success sound
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Play a nice chord (C major - C and E)
        oscillator1.frequency.value = 523.25; // C5
        oscillator2.frequency.value = 659.25; // E5
        oscillator1.type = 'sine';
        oscillator2.type = 'sine';

        // Smooth envelope
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.5);

        oscillator1.start(currentTime);
        oscillator2.start(currentTime);
        oscillator1.stop(currentTime + 0.5);
        oscillator2.stop(currentTime + 0.5);
    }
}

// ============================================
// PANEL RESIZER
// ============================================

class PanelResizer {
    constructor() {
        this.panels = [];
        this.init();
    }

    init() {
        // Wait for DOM to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupResizers());
        } else {
            this.setupResizers();
        }
    }

    setupResizers() {
        // Check if Split.js is available
        if (typeof Split !== 'undefined') {
            this.setupSplitJS();
        } else {
            this.setupCustomResizers();
        }
    }

    setupSplitJS() {
        // Prevent double-initializing Split.js across modules
        if (window.__split_initialized) {
            console.log('Split.js already initialized (themes.js) - skipping duplicate setup');
            return;
        }

        // Setup main horizontal split (thin gutter by default)
        const leftPanel = document.querySelector('.left-panel');
        const rightPanel = document.querySelector('.right-panel');

        if (leftPanel && rightPanel && typeof Split !== 'undefined') {
            // Save initial sizes so user can double-click gutter to reset
            const mainInitialSizes = [50, 50];
            // Store returned Split instance so we can call setSizes later
            try {
                const mainSplit = Split([leftPanel, rightPanel], {
                    sizes: mainInitialSizes.slice(),
                    minSize: 300,
                    gutterSize: 6, // thin by default
                    cursor: 'col-resize',
                    onDragStart: () => {
                        // only toggle dragging class (no inline sizing) so CSS hover/active styles remain
                        document.querySelectorAll('.gutter').forEach(g => g.classList.add('gutter-dragging'));
                    },
                    onDragEnd: () => {
                        document.querySelectorAll('.gutter').forEach(g => g.classList.remove('gutter-dragging'));
                        // Refresh editor if present
                        if (window.AppState && window.AppState.editor) {
                            try { window.AppState.editor.refresh(); } catch (e) {}
                        }
                    }
                });

                // Expose for debugging and other modules
                window.__split_main = mainSplit;

                // Attach double-click handler to reset main split gutters
                // Split.js creates a gutter element with class 'gutter gutter-horizontal'
                setTimeout(() => {
                    try {
                        document.querySelectorAll('.gutter.gutter-horizontal').forEach(g => {
                            // avoid attaching multiple times
                            if (g.__pyinter_dbl_attached) return;
                            g.addEventListener('dblclick', (ev) => {
                                try {
                                    if (window.__split_main && typeof window.__split_main.setSizes === 'function') {
                                        window.__split_main.setSizes(mainInitialSizes.slice());
                                    }
                                } catch (e) { }
                            });
                            g.__pyinter_dbl_attached = true;
                        });
                    } catch (e) { }
                }, 40);
            } catch (e) {
                // ignore split creation errors
            }
        }

        // Setup vertical splits in right panel (thin by default)
        const outputContainer = document.querySelector('.output-container') || document.getElementById('outputContainer');
        const variablesContainer = document.querySelector('.variables-container') || document.getElementById('variablesContainer');

        if (outputContainer && variablesContainer && typeof Split !== 'undefined') {
            const rightInitialSizes = [70, 30];
            try {
                const rightSplit = Split([outputContainer, variablesContainer], {
                    direction: 'vertical',
                    sizes: rightInitialSizes.slice(),
                    minSize: 100,
                    gutterSize: 6,
                    cursor: 'row-resize',
                    onDragStart: () => document.querySelectorAll('.gutter').forEach(g => g.classList.add('gutter-dragging')),
                    onDragEnd: () => document.querySelectorAll('.gutter').forEach(g => g.classList.remove('gutter-dragging'))
                });

                // Expose for debugging
                window.__split_right = rightSplit;

                // Attach dblclick handler to reset vertical gutters
                setTimeout(() => {
                    try {
                        document.querySelectorAll('.gutter.gutter-vertical').forEach(g => {
                            if (g.__pyinter_dbl_attached) return;
                            g.addEventListener('dblclick', (ev) => {
                                try {
                                    if (window.__split_right && typeof window.__split_right.setSizes === 'function') {
                                        window.__split_right.setSizes(rightInitialSizes.slice());
                                    }
                                } catch (e) { }
                            });
                            g.__pyinter_dbl_attached = true;
                        });
                    } catch (e) {}
                }, 40);
            } catch (e) {
                // ignore
            }
        }

        // Mark Split as initialized so other modules don't double-initialize
        window.__split_initialized = true;
    }

    setupCustomResizers() {
        // Custom drag-to-resize implementation
        const resizableElements = document.querySelectorAll('[data-resizable]');
        
        resizableElements.forEach(element => {
            const resizer = document.createElement('div');
            resizer.className = 'custom-resizer';
            resizer.style.cssText = `
                position: absolute;
                right: -4px;
                top: 0;
                bottom: 0;
                width: 8px;
                cursor: col-resize;
                background: transparent;
                z-index: 10;
            `;
            
            element.style.position = 'relative';
            element.appendChild(resizer);

            let isResizing = false;
            let startX = 0;
            let startWidth = 0;

            resizer.addEventListener('mousedown', (e) => {
                isResizing = true;
                startX = e.clientX;
                startWidth = element.offsetWidth;
                document.body.style.cursor = 'col-resize';
                e.preventDefault();
            });

            document.addEventListener('mousemove', (e) => {
                if (!isResizing) return;
                const width = startWidth + (e.clientX - startX);
                if (width > 200) {
                    element.style.width = width + 'px';
                }
            });

            document.addEventListener('mouseup', () => {
                if (isResizing) {
                    isResizing = false;
                    document.body.style.cursor = '';
                }
            });
        });
    }
}

// ============================================
// EXPORT GLOBALS
// ============================================

window.themeManager = new ThemeManager();
window.keyboardSounds = new KeyboardSounds();
window.panelResizer = new PanelResizer();
window.THEMES = THEMES;
window.FONTS = FONTS;
window.PALETTES = PALETTES;

console.log('🎨 Theme System Loaded:', Object.keys(THEMES).length, 'themes available');

// ============================================
// Per-panel font-size adjustment via middle-wheel
// Hold middle mouse button (wheel) and scroll to change font-size for each panel
// Works independently per-panel: code editor, REPL, variables, output
// ============================================

(function setupPanelWheelFontControls() {
    const PANEL_KEYS = {
        code: { selector: '.code-editor, .CodeMirror', storageKey: 'pyinter-font-size-code' },
        repl: { selector: '#replPanel, #replOutput, .repl-output', storageKey: 'pyinter-font-size-repl' },
        variables: { selector: '.variables-container, .variables-content', storageKey: 'pyinter-font-size-vars' },
        output: { selector: '#output, .output-content, .output-container', storageKey: 'pyinter-font-size-output' }
    };

    const DEFAULT = 14; // default px if not set

    function getSize(key) {
        const v = localStorage.getItem(key);
        return v ? parseInt(v, 10) : DEFAULT;
    }

    function setSize(key, px) {
        localStorage.setItem(key, px + 'px');
    }

    function applySizeToElements(selector, sizePx) {
        try {
            // Now handled via CSS variables. We keep this function as a no-op for compatibility.
            // Optionally we could force a refresh for CodeMirror here.
            try { if (window.editor && typeof window.editor.refresh === 'function') window.editor.refresh(); } catch (e) {}
        } catch (e) {}
    }

    // Initialize existing values on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        Object.entries(PANEL_KEYS).forEach(([name, cfg]) => {
            const sizeStr = localStorage.getItem(cfg.storageKey);
            if (sizeStr) {
                try {
                    let varName = '--font-size-code';
                    if (name === 'output') varName = '--font-size-output';
                    else if (name === 'repl') varName = '--font-size-repl';
                    else if (name === 'variables') varName = '--font-size-vars';
                    document.documentElement.style.setProperty(varName, sizeStr);
                    // Keep themeManager state in sync
                    if (window.themeManager) {
                        if (name === 'code') window.themeManager.codeFontSize = sizeStr;
                        if (name === 'output') window.themeManager.outputFontSize = sizeStr;
                        if (name === 'repl') window.themeManager.replFontSize = sizeStr;
                        if (name === 'variables') window.themeManager.varsFontSize = sizeStr;
                        try { window.themeManager.saveSettings(); } catch (e) {}
                    }
                } catch (e) {}
            }
        });
    });

    // Helper to attach wheel handler to element(s)
    function attachPanelHandlers(name, cfg) {
        let isMiddleDown = false;
        let startTarget = null;

        // Use pointerdown to detect middle button across platforms
        document.addEventListener('pointerdown', (e) => {
            if (e.button === 1) { // middle button pressed
                // Only start capturing if initial pointer is inside one of the panel elements
                const hit = e.target.closest ? e.target.closest(cfg.selector) : null;
                if (hit) {
                    isMiddleDown = true;
                    startTarget = hit;
                    // Prevent middle click from opening autoscroll UI in some browsers
                    e.preventDefault();
                }
            }
        }, { passive: false });

        document.addEventListener('pointerup', (e) => {
            if (e.button === 1) {
                isMiddleDown = false;
                startTarget = null;
            }
        });

        // Wheel listener - only reacts while middle is held and pointer started inside panel
        document.addEventListener('wheel', (e) => {
            if (!isMiddleDown || !startTarget) return;

            // Ensure the current pointer is also over the same panel (so dragging across panels won't change other panels)
            const current = document.elementFromPoint(e.clientX, e.clientY);
            if (!current) return;
            const over = current.closest ? current.closest(cfg.selector) : null;
            if (!over || !startTarget.contains(over) && !over.contains(startTarget)) {
                // not the same panel area
                return;
            }

            // adjust size: wheel deltaY positive -> scroll down -> decrease size
            const delta = e.deltaY;
            const key = cfg.storageKey;
            let size = getSize(key);
            // Change step: 1px per notch (clamp between 8 and 36)
            if (delta > 0) size = Math.max(8, size - 1);
            else if (delta < 0) size = Math.min(36, size + 1);

            // Persist in localStorage
            setSize(key, size);

            // Update CSS variables for the panel so styles handle application consistently
            try {
                if (name === 'code') {
                    document.documentElement.style.setProperty('--font-size-code', size + 'px');
                    // keep themeManager state in sync
                    if (window.themeManager) { window.themeManager.codeFontSize = size + 'px'; }
                } else if (name === 'output') {
                    document.documentElement.style.setProperty('--font-size-output', size + 'px');
                    if (window.themeManager) { window.themeManager.outputFontSize = size + 'px'; }
                } else if (name === 'repl') {
                    document.documentElement.style.setProperty('--font-size-repl', size + 'px');
                    if (window.themeManager) { window.themeManager.replFontSize = size + 'px'; }
                } else if (name === 'variables') {
                    document.documentElement.style.setProperty('--font-size-vars', size + 'px');
                    if (window.themeManager) { window.themeManager.varsFontSize = size + 'px'; }
                }

                // Persist through themeManager.saveSettings if available
                try { if (window.themeManager && typeof window.themeManager.saveSettings === 'function') window.themeManager.saveSettings(); } catch (e) {}

                // If adjusting code panel, also update themeManager applyCodeFontSize so editor refreshes cleanly
                if (name === 'code' && window.themeManager && typeof window.themeManager.applyCodeFontSize === 'function') {
                    try { window.themeManager.applyCodeFontSize(size + 'px'); } catch (e) {}
                }
            } catch (e) {}

            // Optional: show a small overlay hint near pointer (brief)
            showSizeHint(e.clientX, e.clientY, size + 'px');

            // Prevent page scroll when adjusting font
            e.preventDefault();
        }, { passive: false });
    }

    // Tiny overlay hint
    let hintTimer = null;
    function showSizeHint(x, y, text) {
        let hint = document.getElementById('pyinter-font-hint');
        if (!hint) {
            hint = document.createElement('div');
            hint.id = 'pyinter-font-hint';
            hint.style.position = 'fixed';
            hint.style.zIndex = 99999;
            hint.style.padding = '6px 8px';
            hint.style.borderRadius = '6px';
            hint.style.background = 'rgba(0,0,0,0.7)';
            hint.style.color = '#fff';
            hint.style.fontSize = '12px';
            hint.style.pointerEvents = 'none';
            document.body.appendChild(hint);
        }
        hint.textContent = text;
        hint.style.left = (x + 12) + 'px';
        hint.style.top = (y + 12) + 'px';
        hint.style.opacity = '1';

        clearTimeout(hintTimer);
        hintTimer = setTimeout(() => {
            if (hint) hint.style.opacity = '0';
        }, 900);
    }

    // Attach handlers for each panel type
    Object.entries(PANEL_KEYS).forEach(([name, cfg]) => attachPanelHandlers(name, cfg));

    // Public helper for programmatic adjustments (optional)
    window.pyinterFontSize = {
        getSize: (panelName) => getSize(PANEL_KEYS[panelName].storageKey),
        setSize: (panelName, px) => {
            const cfg = PANEL_KEYS[panelName];
            if (!cfg) return;
            const value = px + 'px';
            setSize(cfg.storageKey, px);
            // Map panel to CSS variable
            try {
                if (panelName === 'code') {
                    document.documentElement.style.setProperty('--font-size-code', value);
                    if (window.themeManager) { window.themeManager.codeFontSize = value; }
                } else if (panelName === 'output') {
                    document.documentElement.style.setProperty('--font-size-output', value);
                    if (window.themeManager) { window.themeManager.outputFontSize = value; }
                } else if (panelName === 'repl') {
                    document.documentElement.style.setProperty('--font-size-repl', value);
                    if (window.themeManager) { window.themeManager.replFontSize = value; }
                } else if (panelName === 'variables') {
                    document.documentElement.style.setProperty('--font-size-vars', value);
                    if (window.themeManager) { window.themeManager.varsFontSize = value; }
                }
                try { if (window.themeManager && typeof window.themeManager.saveSettings === 'function') window.themeManager.saveSettings(); } catch (e) {}
                try { if (window.editor && typeof window.editor.refresh === 'function') window.editor.refresh(); } catch (e) {}
            } catch (e) {}
        }
    };

})();
