/**
 * Enhanced Settings UI for PyInter
 * Handles theme selection, accent colors, fonts, glassmorphism, and more
 */

class SettingsUI {
    constructor() {
        this.modal = null;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.createEnhancedSettingsModal();
        this.attachEventListeners();
        this.loadCurrentSettings();
        // Apply interface font from saved settings (ensures buttons and UI use saved font)
        this.applyInterfaceFontFromSettings();
    }

    createEnhancedSettingsModal() {
        // Find existing settings modal or create new one
        let modal = document.getElementById('settingsModal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'settingsModal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-content settings-modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-palette"></i> Customization Settings</h2>
                    <button class="close-btn" id="closeSettingsBtn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body settings-modal-body">
                    <!-- Theme Selection -->
                    <div class="settings-section">
                        <h3><i class="fas fa-swatchbook"></i> Theme</h3>
                        <p class="section-description">Choose from ${Object.keys(THEMES).length}+ beautiful themes</p>
                        
                        <div class="theme-grid" id="themeGrid">
                            <!-- Themes will be populated here -->
                        </div>
                    </div>

                    <!-- Font Color Pallets -->
                    <div class="settings-section">
                        <h3><i class="fas fa-brush"></i> Font Color Pallet</h3>
                        <p class="section-description">Choose a syntax color pallet (adapts to dark/light mode)</p>
                        <div class="palette-controls">
                            <select id="paletteSelect" class="setting-select">
                                <!-- options populated by JS -->
                            </select>
                            <div id="palettePreview" class="palette-preview" style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
                                <!-- small swatches show preview -->
                            </div>
                            <button class="btn btn-secondary" id="resetPaletteBtn" style="margin-top:8px;">
                                <i class="fas fa-undo"></i> Reset Palette
                            </button>
                        </div>
                    </div>

                    <!-- Accent Color -->
                    <div class="settings-section">
                        <h3><i class="fas fa-paint-brush"></i> Accent Color</h3>
                        <p class="section-description">Customize the accent color throughout the UI</p>
                        
                        <div class="accent-color-controls">
                            <div class="color-picker-wrapper">
                                <input type="color" id="accentColorPicker" class="color-picker">
                                <label for="accentColorPicker" class="color-picker-label">
                                    Pick Custom Color
                                </label>
                            </div>
                            
                            <div class="preset-colors">
                                <button class="preset-color" style="background: #667eea" data-color="#667eea" title="Purple"></button>
                                <button class="preset-color" style="background: #f59e0b" data-color="#f59e0b" title="Orange"></button>
                                <button class="preset-color" style="background: #10b981" data-color="#10b981" title="Green"></button>
                                <button class="preset-color" style="background: #ef4444" data-color="#ef4444" title="Red"></button>
                                <button class="preset-color" style="background: #06b6d4" data-color="#06b6d4" title="Cyan"></button>
                                <button class="preset-color" style="background: #ec4899" data-color="#ec4899" title="Pink"></button>
                                <button class="preset-color" style="background: #8b5cf6" data-color="#8b5cf6" title="Violet"></button>
                                <button class="preset-color" style="background: #14b8a6" data-color="#14b8a6" title="Teal"></button>
                            </div>
                            
                            <button class="btn btn-secondary" id="resetAccentColor">
                                <i class="fas fa-undo"></i> Reset to Theme Default
                            </button>
                        </div>
                    </div>

                    <!-- Font Selection -->
                    <div class="settings-section">
                        <h3><i class="fas fa-font"></i> Fonts</h3>
                        <p class="section-description">Customize fonts for code editor and UI</p>
                        
                        <div class="font-controls">
                            <div class="setting-item">
                                <label for="codeFontSelect">Code Editor Font</label>
                                <select id="codeFontSelect" class="setting-select">
                                    <!-- Options populated by JS -->
                                </select>
                                <div class="font-preview code-font-preview" id="codeFontPreview">
                                    function hello() { return "Hello, World!"; }
                                </div>
                            </div>
                            
                            <div class="setting-item">
                                <label for="uiFontSelect">Interface Font</label>
                                <select id="uiFontSelect" class="setting-select">
                                    <!-- Options populated by JS -->
                                </select>
                                <div class="font-preview ui-font-preview" id="uiFontPreview">
                                    The quick brown fox jumps over the lazy dog
                                </div>
                            </div>
                            
                            <div class="setting-item">
                                <label for="codeFontSizeSlider">Code Font Size: <span id="codeFontSizeValue">14px</span></label>
                                <input type="range" id="codeFontSizeSlider" class="setting-slider" min="10" max="24" value="14" step="1">
                            </div>
                            
                            <div class="setting-item">
                                <label for="uiFontSizeSlider">UI Font Size: <span id="uiFontSizeValue">14px</span></label>
                                <input type="range" id="uiFontSizeSlider" class="setting-slider" min="10" max="20" value="14" step="1">
                            </div>
                        </div>
                    </div>

                    <!-- Effects -->
                    <div class="settings-section">
                        <h3><i class="fas fa-magic"></i> Visual Effects</h3>
                        <p class="section-description">Enable special visual effects</p>
                        
                        <div class="setting-item">
                            <div class="setting-toggle-row">
                                <div>
                                    <label>Glassmorphism Effect</label>
                                    <p class="setting-hint">Frosted glass blur effect on panels</p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="glassmorphismToggle">
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Sound Effects -->
                    <div class="settings-section">
                        <h3><i class="fas fa-volume-up"></i> Sound Effects</h3>
                        <p class="section-description">Audio feedback while coding</p>
                        
                        <div class="setting-item">
                            <div class="setting-toggle-row">
                                <div>
                                    <label>Keyboard Typing Sounds</label>
                                    <p class="setting-hint">Mechanical keyboard sound when typing</p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="soundEffectsToggle">
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        <button class="btn btn-secondary" id="testSoundBtn">
                            <i class="fas fa-play"></i> Test Sound
                        </button>
                    </div>

                    <!-- Panel Layout -->
                    <div class="settings-section">
                        <h3><i class="fas fa-th-large"></i> Layout</h3>
                        <p class="section-description">Customize panel behavior</p>
                        
                        <div class="setting-item">
                            <div class="setting-toggle-row">
                                <div>
                                    <label>Resizable Panels</label>
                                    <p class="setting-hint">Drag to resize panels (requires page refresh)</p>
                                </div>
                                <label class="switch">
                                    <input type="checkbox" id="resizablePanelsToggle" checked disabled>
                                    <span class="slider"></span>
                                </label>
                            </div>
                        </div>
                        
                        <p class="info-message">
                            <i class="fas fa-info-circle"></i>
                            All panels are now resizable! Drag the borders between panels to adjust sizes.
                        </p>
                    </div>

                    <!-- Import/Export Settings -->
                    <div class="settings-section">
                        <h3><i class="fas fa-download"></i> Settings Management</h3>
                        <p class="section-description">Save and restore your preferences</p>
                        
                        <div class="settings-actions">
                            <button class="btn btn-secondary" id="exportSettingsBtn">
                                <i class="fas fa-download"></i> Export Settings
                            </button>
                            <button class="btn btn-secondary" id="importSettingsBtn">
                                <i class="fas fa-upload"></i> Import Settings
                            </button>
                            <input type="file" id="importSettingsFile" accept=".json" style="display: none;">
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="resetAllSettingsBtn">
                        <i class="fas fa-undo"></i> Reset All to Default
                    </button>
                    <button class="btn btn-primary" id="saveSettingsBtn">
                        <i class="fas fa-check"></i> Save & Apply
                    </button>
                </div>
            </div>
        `;

        this.modal = modal;
        this.populateThemes();
        this.populateFonts();
    }

    populateThemes() {
        const grid = document.getElementById('themeGrid');
        if (!grid) return;

        const themes = window.themeManager.getAvailableThemes();
        
        grid.innerHTML = themes.map(theme => `
            <div class="theme-card ${theme.id === window.themeManager.currentTheme ? 'active' : ''}" 
                 data-theme="${theme.id}">
                <div class="theme-preview" style="background: linear-gradient(135deg, 
                    ${THEMES[theme.id].colors.primary} 0%, 
                    ${THEMES[theme.id].colors.secondary} 50%, 
                    ${THEMES[theme.id].colors.accent} 100%)">
                </div>
                <div class="theme-info">
                    <div class="theme-name">${theme.name}</div>
                    <div class="theme-type">${theme.type}</div>
                </div>
                <div class="theme-check">
                    <i class="fas fa-check"></i>
                </div>
            </div>
        `).join('');

        // Add click handlers
        grid.querySelectorAll('.theme-card').forEach(card => {
            card.addEventListener('click', () => {
                const themeName = card.dataset.theme;
                this.selectTheme(themeName);
            });
        });
    }

    populateFonts() {
        const fonts = window.themeManager.getAvailableFonts();
        
        // Code fonts
        const codeFontSelect = document.getElementById('codeFontSelect');
        if (codeFontSelect) {
            codeFontSelect.innerHTML = fonts.code.map(font => 
                `<option value="${font}" ${font === window.themeManager.codeFont ? 'selected' : ''}>${font}</option>`
            ).join('');
        }

        // UI fonts
        const uiFontSelect = document.getElementById('uiFontSelect');
        if (uiFontSelect) {
            uiFontSelect.innerHTML = fonts.ui.map(font => 
                `<option value="${font}" ${font === window.themeManager.uiFont ? 'selected' : ''}>${font}</option>`
            ).join('');
        }
    }

    populatePalettes() {
        const select = document.getElementById('paletteSelect');
        if (!select || !window.themeManager) return;

        const palettes = window.themeManager.getAvailablePalettes();
        select.innerHTML = palettes.map(p => `<option value="${p.id}" ${p.id === window.themeManager.currentPalette ? 'selected' : ''}>${p.name}</option>`).join('');

        // render preview
        this.renderPalettePreview(window.themeManager.currentPalette || palettes[0]?.id);

        select.addEventListener('change', (e) => {
            const id = e.target.value;
            window.themeManager.applyPalette(id);
            this.renderPalettePreview(id);
            this.showNotification('Font color pallet applied', 'success');
        });

        document.getElementById('resetPaletteBtn')?.addEventListener('click', () => {
            window.themeManager.currentPalette = 'default';
            window.themeManager.saveSettings();
            window.themeManager.applyPalette('default');
            this.renderPalettePreview('default');
            this.showNotification('Palette reset to default', 'success');
        });
    }

    renderPalettePreview(paletteId) {
        const preview = document.getElementById('palettePreview');
        if (!preview || !window.PALETTES) return;

        // determine variant based on theme type
        const themeType = THEMES[window.themeManager.currentTheme]?.type || 'dark';
        const variant = themeType === 'light' ? 'light' : 'dark';
        const p = PALETTES[paletteId] || PALETTES.default;
        const colors = p[variant] || p.dark;

        preview.innerHTML = `
            <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                <div style="width:14px; height:14px; background:${colors.keyword}; border-radius:3px" title="keyword"></div>
                <div style="width:14px; height:14px; background:${colors.plain}; border-radius:3px" title="plain"></div>
                <div style="width:14px; height:14px; background:${colors.comment}; border-radius:3px" title="comment"></div>
                <div style="width:14px; height:14px; background:${colors.string}; border-radius:3px" title="string"></div>
                <div style="width:14px; height:14px; background:${colors.func}; border-radius:3px" title="function"></div>
                <div style="width:14px; height:14px; background:${colors.number}; border-radius:3px" title="number"></div>
                <div style="width:14px; height:14px; background:${colors.operator}; border-radius:3px" title="operator"></div>
                <div style="width:14px; height:14px; background:${colors.variable}; border-radius:3px" title="variable"></div>
            </div>
        `;
    }

    selectTheme(themeName) {
        // Update UI
        document.querySelectorAll('.theme-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-theme="${themeName}"]`)?.classList.add('active');

        // Apply theme
        window.themeManager.applyTheme(themeName);
        
        // Show notification
        this.showNotification(`Theme changed to ${THEMES[themeName].name}`, 'success');
    }

    attachEventListeners() {
        // Close button
        document.getElementById('closeSettingsBtn')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Accent color picker
        document.getElementById('accentColorPicker')?.addEventListener('change', (e) => {
            window.themeManager.applyAccentColor(e.target.value);
            this.showNotification('Accent color updated', 'success');
        });

        // Preset colors
        document.querySelectorAll('.preset-color').forEach(btn => {
            btn.addEventListener('click', () => {
                const color = btn.dataset.color;
                document.getElementById('accentColorPicker').value = color;
                window.themeManager.applyAccentColor(color);
                this.showNotification('Accent color updated', 'success');
            });
        });

        // Ensure preset buttons visually show their own colors (prevent theme CSS from overriding)
        document.querySelectorAll('.preset-color').forEach(btn => {
            try {
                const c = btn.dataset.color || window.getComputedStyle(btn).backgroundColor;
                // set inline background with priority so it won't be overridden by theme rules
                btn.style.setProperty('background', c, 'important');
                // keep title/aria-label in sync
                if (!btn.title && c) btn.title = c;
                btn.setAttribute('aria-label', `Preset color ${btn.title || c}`);
            } catch (e) { /* ignore */ }
        });

    // Populate palettes after themes are ready
    this.populatePalettes();

        // Reset accent color
        document.getElementById('resetAccentColor')?.addEventListener('click', () => {
            window.themeManager.accentColor = null;
            window.themeManager.saveSettings();
            window.themeManager.applyTheme(window.themeManager.currentTheme);
            this.showNotification('Accent color reset to theme default', 'success');
        });

        // Font selectors
        document.getElementById('codeFontSelect')?.addEventListener('change', (e) => {
            window.themeManager.applyCodeFont(e.target.value);
            this.updateFontPreview('code', e.target.value);
            this.showNotification(`Code font changed to ${e.target.value}`, 'success');
        });

        document.getElementById('uiFontSelect')?.addEventListener('change', (e) => {
            window.themeManager.applyUIFont(e.target.value);
            this.updateFontPreview('ui', e.target.value);
            this.showNotification(`UI font changed to ${e.target.value}`, 'success');
            // Immediately apply the selected UI font to CSS variables so buttons update
            this.applyInterfaceFontFromSettings(e.target.value);
        });

        // Font size sliders
        document.getElementById('codeFontSizeSlider')?.addEventListener('input', (e) => {
            const size = e.target.value + 'px';
            document.getElementById('codeFontSizeValue').textContent = size;
            window.themeManager.applyCodeFontSize(size);
        });

        document.getElementById('uiFontSizeSlider')?.addEventListener('input', (e) => {
            const size = e.target.value + 'px';
            document.getElementById('uiFontSizeValue').textContent = size;
            window.themeManager.applyUIFontSize(size);
            // Apply the new size immediately to root CSS variables
            this.applyInterfaceFontFromSettings();
        });

        // Glassmorphism toggle
        document.getElementById('glassmorphismToggle')?.addEventListener('change', (e) => {
            window.themeManager.applyGlassmorphism(e.target.checked);
            // Toggle a root-level class so CSS can apply glass styles globally
            if (e.target.checked) {
                document.documentElement.classList.add('glassmorphism-enabled');
            } else {
                document.documentElement.classList.remove('glassmorphism-enabled');
            }
            this.showNotification(e.target.checked ? 'Glassmorphism enabled' : 'Glassmorphism disabled', 'success');
        });

        // Sound effects toggle
        document.getElementById('soundEffectsToggle')?.addEventListener('change', (e) => {
            window.keyboardSounds.toggle(e.target.checked);
            this.showNotification(e.target.checked ? 'Keyboard sounds enabled' : 'Keyboard sounds disabled', 'success');
        });

        // Test sound button
        document.getElementById('testSoundBtn')?.addEventListener('click', () => {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => window.keyboardSounds.playKeySound(), i * 100);
            }
        });

        // Export settings
        document.getElementById('exportSettingsBtn')?.addEventListener('click', () => {
            this.exportSettings();
        });

        // Import settings
        document.getElementById('importSettingsBtn')?.addEventListener('click', () => {
            document.getElementById('importSettingsFile')?.click();
        });

        document.getElementById('importSettingsFile')?.addEventListener('change', (e) => {
            this.importSettings(e.target.files[0]);
        });

        // Reset all settings
        document.getElementById('resetAllSettingsBtn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all settings to default?')) {
                this.resetAllSettings();
            }
        });

        // Save and apply
        document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
            this.showNotification('Settings saved successfully!', 'success');
            this.closeModal();
            // Re-apply interface font after save in case themeManager changed stored value
            this.applyInterfaceFontFromSettings();
        });

        // Open settings button
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            this.openModal();
        });
    }

    loadCurrentSettings() {
        // Load glassmorphism state
        const glassToggle = document.getElementById('glassmorphismToggle');
        if (glassToggle) {
            glassToggle.checked = window.themeManager.glassmorphism;
        }

        // Load sound effects state
        const soundToggle = document.getElementById('soundEffectsToggle');
        if (soundToggle) {
            soundToggle.checked = window.keyboardSounds.enabled;
        }

        // Load accent color
        const colorPicker = document.getElementById('accentColorPicker');
        if (colorPicker && window.themeManager.accentColor) {
            colorPicker.value = window.themeManager.accentColor;
        }

        // Load font sizes
        const codeFontSizeSlider = document.getElementById('codeFontSizeSlider');
        const codeFontSizeValue = document.getElementById('codeFontSizeValue');
        if (codeFontSizeSlider && window.themeManager.codeFontSize) {
            const size = parseInt(window.themeManager.codeFontSize);
            codeFontSizeSlider.value = size;
            codeFontSizeValue.textContent = size + 'px';
        }

        const uiFontSizeSlider = document.getElementById('uiFontSizeSlider');
        const uiFontSizeValue = document.getElementById('uiFontSizeValue');
        if (uiFontSizeSlider && window.themeManager.uiFontSize) {
            const size = parseInt(window.themeManager.uiFontSize);
            uiFontSizeSlider.value = size;
            uiFontSizeValue.textContent = size + 'px';
        }

        // Update font previews
        this.updateFontPreview('code', window.themeManager.codeFont);
        this.updateFontPreview('ui', window.themeManager.uiFont);

    // Ensure UI font is applied when settings load
    this.applyInterfaceFontFromSettings();

        // Load palette selection
        const paletteSelect = document.getElementById('paletteSelect');
        if (paletteSelect && window.themeManager && window.themeManager.currentPalette) {
            paletteSelect.value = window.themeManager.currentPalette;
            this.renderPalettePreview(window.themeManager.currentPalette);
        }

        // Ensure document-level glassmorphism class matches stored setting
        try {
            if (window.themeManager && window.themeManager.glassmorphism) {
                document.documentElement.classList.add('glassmorphism-enabled');
            } else {
                document.documentElement.classList.remove('glassmorphism-enabled');
            }
        } catch (e) { /* ignore if themeManager isn't yet available */ }
    }

    updateFontPreview(type, fontName) {
        const preview = document.getElementById(`${type}FontPreview`);
        if (preview) {
            const fontFamily = type === 'code' ? FONTS.code[fontName] : FONTS.ui[fontName];
            preview.style.fontFamily = fontFamily;
        }
    }

    /**
     * Read stored UI font and size from themeManager / localStorage and apply them
     * to root CSS variables so all UI controls (buttons, selects, nav items) use it.
     * If fontName parameter is provided, use it immediately; otherwise read from
     * window.themeManager.uiFont and window.themeManager.uiFontSize or localStorage.
     */
    applyInterfaceFontFromSettings(fontName) {
        try {
            const root = document.documentElement;
            // Determine font family string (mapping via FONTS.ui if available)
            let uiFont = fontName || (window.themeManager && window.themeManager.uiFont) || null;
            let uiFontSize = (window.themeManager && window.themeManager.uiFontSize) || null;

            // If themeManager provides a named font key and FONTS.ui has mapping, use it
            if (uiFont && window.FONTS && window.FONTS.ui && window.FONTS.ui[uiFont]) {
                root.style.setProperty('--font-ui', window.FONTS.ui[uiFont]);
            } else if (uiFont) {
                // uiFont may already be a CSS font-family string
                root.style.setProperty('--font-ui', uiFont);
            } else {
                // fallback to existing --font-ui variable
            }

            if (uiFontSize) {
                // ensure value ends with px where appropriate
                if (typeof uiFontSize === 'number' || /^[0-9]+$/.test(String(uiFontSize))) {
                    uiFontSize = `${uiFontSize}px`;
                }
                // set both variable names to remain compatible with existing code
                root.style.setProperty('--font-ui-size', uiFontSize);
                root.style.setProperty('--font-size-ui', uiFontSize);
            }
        } catch (e) {
            // silently ignore in case themeManager isn't available yet
            console.warn('Failed to apply interface font from settings', e);
        }
    }

    openModal() {
        if (this.modal) {
            // ensure a backdrop exists so the glass effect is visible and clicks outside can close
            let backdrop = document.querySelector('.modal-backdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.className = 'modal-backdrop';
                document.body.appendChild(backdrop);
                // clicking the backdrop closes the modal
                backdrop.addEventListener('click', () => this.closeModal());
            }

            // make both visible
            backdrop.classList.add('active');
            this.modal.classList.add('active');
            this.loadCurrentSettings();
            // move focus into the modal for accessibility
            const firstFocusable = this.modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstFocusable) firstFocusable.focus();
        }
    }

    closeModal() {
        if (this.modal) {
            this.modal.classList.remove('active');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.classList.remove('active');
                // remove from DOM after a short delay to allow any fade-out transitions
                setTimeout(() => { try { backdrop.remove(); } catch (e) {} }, 220);
            }
            // return focus to settings button if available
            const settingsBtn = document.getElementById('settingsBtn');
            if (settingsBtn) settingsBtn.focus();
        }
    }

    exportSettings() {
        const settings = window.themeManager.settings;
        const dataStr = JSON.stringify(settings, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pyinter-settings.json';
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Settings exported successfully', 'success');
    }

    importSettings(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const settings = JSON.parse(e.target.result);
                localStorage.setItem('pyinter-settings', JSON.stringify(settings));
                
                // Reload page to apply settings
                this.showNotification('Settings imported! Reloading page...', 'success');
                setTimeout(() => location.reload(), 1500);
            } catch (error) {
                this.showNotification('Failed to import settings: Invalid file', 'error');
            }
        };
        reader.readAsText(file);
    }

    resetAllSettings() {
        localStorage.removeItem('pyinter-settings');
        this.showNotification('All settings reset! Reloading page...', 'success');
        setTimeout(() => location.reload(), 1500);
    }

    showNotification(message, type = 'info') {
        // Create or get toast container
        let container = document.getElementById('toastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toastContainer';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        // Create toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to container
        container.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        });
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.settingsUI = new SettingsUI();
    });
} else {
    window.settingsUI = new SettingsUI();
}
