// 双语认读卡片助手 - 主要JavaScript逻辑

// 统一管理 localStorage 的 key，避免散落的字符串字面量拼写错误
const STORAGE_KEYS = {
    MISTAKES: 'flashcard_mistakes',
    BANISHED: 'flashcard_banished'
};

class FlashcardApp {
    constructor() {
        this.cards = [];
        this.currentCardIndex = 0;
        this.currentRound = 1;
        this.masteredCards = [];
        this.notMasteredCards = [];
        this.totalAttempts = 0; // 累计总尝试次数
        this.isFlipped = false;
        this.aiPromptModal = null;
        this.instructionsModal = null;
        this.endRoundModal = null;
        this.unitModal = null;
        
        this.audioContext = null; // 延迟创建的音频上下文单例

        // 新增：撤销和结束学习相关变量
        this.lastProcessedCard = null; // 记录上一个处理的卡片
        this.utilityButtons = null; // 工具按钮容器
        this.endStudyModal = null; // 结束学习模态框
        this.undoBtn = null; // 撤销按钮
        this.endStudyBtn = null; // 结束学习按钮
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        // 输入相关元素
        this.cardInput = document.getElementById('cardInput');
        this.generateBtn = document.getElementById('generateBtn');
        this.cardCount = document.getElementById('cardCount');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.shuffleOption = document.getElementById('shuffleOption');
        this.copyPromptBtn = document.getElementById('copyPromptBtn');
        this.instructionsBtn = document.getElementById('instructionsBtn');
        this.importUnitsBtn = document.getElementById('importUnitsBtn');
        this.mistakeBookBtn = document.getElementById('mistakeBookBtn');
        this.banishBookBtn = document.getElementById('banishBookBtn');
        this.autoSpeakOption = document.getElementById('autoSpeakOption');
        this.speakBtn = document.getElementById('speakBtn');

        // 学习相关元素
        this.inputSection = document.getElementById('inputSection');
        this.studySection = document.getElementById('studySection');
        this.studyCard = document.getElementById('studyCard');
        this.englishText = document.getElementById('englishText');
        this.chineseText = document.getElementById('chineseText');
        this.controlButtons = document.getElementById('controlButtons');

        // 进度相关元素
        this.currentProgress = document.getElementById('currentProgress');
        this.totalCards = document.getElementById('totalCards');
        this.progressBar = document.getElementById('progressBar');
        this.masteredCount = document.getElementById('masteredCount');
        this.notMasteredCount = document.getElementById('notMasteredCount');
        this.roundCount = document.getElementById('roundCount');

        // 按钮元素
        this.masteredBtn = document.getElementById('masteredBtn');
        this.notMasteredBtn = document.getElementById('notMasteredBtn');
        this.banishBtn = document.getElementById('banishBtn');
        this.quickMasteredBtn = document.getElementById('quickMasteredBtn');
        this.quickBanishBtn = document.getElementById('quickBanishBtn');
        this.frontQuickButtons = document.getElementById('frontQuickButtons');
        this.restartBtn = document.getElementById('restartBtn');

        // 完成界面元素
        this.completionSection = document.getElementById('completionSection');
        this.finalCardCount = document.getElementById('finalCardCount');
        this.totalRounds = document.getElementById('totalRounds');
        this.efficiency = document.getElementById('efficiency');

        // 新增：工具按钮相关元素
        this.undoBtn = document.getElementById('undoBtn');
        this.endStudyBtn = document.getElementById('endStudyBtn');
        this.utilityButtons = document.getElementById('utilityButtons');
        this.speakBtnWrapper = document.getElementById('speakBtnWrapper');

        // 初始化语音
        this.initSpeech();
    }

    bindEvents() {
        // 输入事件
        this.cardInput.addEventListener('input', () => this.updateCardCount());
        
        // 确保按钮事件正确绑定
        if (this.generateBtn) {
            this.generateBtn.addEventListener('click', (e) => {
                console.log('Generate button clicked');
                e.preventDefault();
                this.generateCards();
            });
        }
        
        if (this.shuffleBtn) {
            this.shuffleBtn.addEventListener('click', () => this.shuffleCards());
        }

        // AI提示词按钮事件
        if (this.copyPromptBtn) {
            this.copyPromptBtn.addEventListener('click', () => this.copyAIPrompt());
        }

        // 使用说明按钮事件
        if (this.instructionsBtn) {
            this.instructionsBtn.addEventListener('click', () => this.showInstructionsModal());
        }

        // Unit导入按钮事件
        if (this.importUnitsBtn) {
            this.importUnitsBtn.addEventListener('click', () => this.showUnitModal());
        }

        // 错题本按钮事件
        if (this.mistakeBookBtn) {
            this.mistakeBookBtn.addEventListener('click', () => this.showMistakeBookModal());
        }

        // 斩词本按钮事件
        if (this.banishBookBtn) {
            this.banishBookBtn.addEventListener('click', () => this.showBanishBookModal());
        }

        // 卡片交互事件
        if (this.studyCard) {
            this.studyCard.addEventListener('click', () => this.flipCard());
        }
        
        if (this.masteredBtn) {
            this.masteredBtn.addEventListener('click', () => this.markMastered());
        }
        
        if (this.notMasteredBtn) {
            this.notMasteredBtn.addEventListener('click', () => this.markNotMastered());
        }

        if (this.banishBtn) {
            this.banishBtn.addEventListener('click', () => this.markBanished());
        }

        if (this.quickMasteredBtn) {
            this.quickMasteredBtn.addEventListener('click', () => this.markMastered());
        }

        if (this.quickBanishBtn) {
            this.quickBanishBtn.addEventListener('click', () => this.markBanished());
        }

        if (this.restartBtn) {
            this.restartBtn.addEventListener('click', () => this.restart());
        }

        // 新增：工具按钮事件
        if (this.undoBtn) {
            this.undoBtn.addEventListener('click', () => this.undoLastSelection());
        }
        
        if (this.endStudyBtn) {
            this.endStudyBtn.addEventListener('click', () => this.showEndStudyModal());
        }

        // 语音朗读按钮事件
        if (this.speakBtn) {
            this.speakBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.speakCurrentCard();
            });
        }

        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    initSpeech() {
        if (!window.speechSynthesis) {
            console.warn('当前浏览器不支持语音朗读');
            return;
        }
        
        // 预加载语音列表（Chrome等浏览器需要异步加载）
        this.speechVoices = [];
        const loadVoices = () => {
            this.speechVoices = window.speechSynthesis.getVoices();
            this.populateVoiceSelect();
        };
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }

    populateVoiceSelect() {
        const select = document.getElementById('voiceSelect');
        if (!select || this.speechVoices.length === 0) return;
        
        // 只保留英语语音，并过滤掉奇怪的效果音
        const enVoices = this.speechVoices.filter(v => v.lang && v.lang.startsWith('en') && this.isNormalHumanVoice(v));
        if (enVoices.length <= 1) {
            select.parentElement.style.display = 'none';
            return;
        }
        
        // 将推荐语音排到最前面
        const recommended = ['Samantha', 'Alex', 'Google US English', 'Daniel'];
        const topVoices = [];
        const restVoices = [];
        enVoices.forEach(v => {
            if (recommended.includes(v.name)) topVoices.push(v);
            else restVoices.push(v);
        });
        // 推荐语音按推荐顺序排列
        topVoices.sort((a, b) => recommended.indexOf(a.name) - recommended.indexOf(b.name));
        const sortedVoices = [...topVoices, ...restVoices];

        select.innerHTML = '';
        sortedVoices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})` + (recommended.includes(voice.name) ? ' ★' : '');
            select.appendChild(option);
        });
        
        // 默认选中最佳语音
        const best = this.getBestEnglishVoice();
        if (best) {
            select.value = best.name;
        }
        
        select.parentElement.style.display = 'flex';
    }

    isNormalHumanVoice(voice) {
        if (!voice || !voice.name) return false;
        const nameLower = voice.name.toLowerCase();
        // 排除已知的效果音/合成音效/非真人语音（macOS/iOS/Windows 常见）
        const effectKeywords = [
            'bubble', 'bubbles', 'bell', 'bells', 'boing',
            'organ', 'pipe organ', 'cellos', 'cello',
            'bad news', 'good news', 'jester', 'superstar',
            'trinoids', 'zarvox', 'deranged', 'hysterical',
            'whisper', 'albert', 'rocko', 'flo', 'wobble',
            'princess', 'vicki', 'bruce', 'fred',
            'grandma', 'grandpa', 'grand mother', 'grand father',
            'sandy', 'shelley', 'junior', 'ralph',
            'news', 'novelty', 'effect', 'singing', 'song',
            'robot', 'alien', 'monster', 'ghost', 'elf',
        ];
        return !effectKeywords.some(kw => nameLower.includes(kw));
    }

    getBestEnglishVoice() {
        if (!this.speechVoices || this.speechVoices.length === 0) return null;
        
        const enVoices = this.speechVoices.filter(v => v.lang && v.lang.startsWith('en') && this.isNormalHumanVoice(v));
        if (enVoices.length === 0) return null;
        
        // 精选 4 个发音最标准、最适合小朋友学英语的真人语音
        const preferredNames = [
            'Samantha',            // macOS - 美音女声，清晰自然
            'Alex',                // macOS - 美音男声，标准美式发音
            'Google US English',   // Chrome - 神经网络语音，品质极高
            'Daniel',              // macOS - 英音男声，备选英式发音
        ];
        
        for (const name of preferredNames) {
            const voice = enVoices.find(v => v.name === name);
            if (voice) return voice;
        }
        
        // 优先选择云端语音（通常质量更好）
        const nonLocal = enVoices.find(v => !v.localService);
        if (nonLocal) return nonLocal;
        
        return enVoices[0];
    }

    speak(text) {
        if (!window.speechSynthesis) {
            this.showNotification('您的浏览器不支持语音朗读', 'warning');
            return;
        }

        // 取消当前正在播放的语音
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.85; // 稍慢，适合小朋友跟读
        utterance.pitch = 1.05; // 稍微明亮一点

        // 选择最佳英语语音（优先用户手动选择，其次自动匹配）
        const voiceSelect = document.getElementById('voiceSelect');
        let selectedVoice = null;
        if (voiceSelect && voiceSelect.value) {
            selectedVoice = this.speechVoices.find(v => v.name === voiceSelect.value);
        }
        if (!selectedVoice) {
            selectedVoice = this.getBestEnglishVoice();
        }
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        // 视觉反馈
        if (this.speakBtn) {
            this.speakBtn.classList.add('speaking');
            const speakText = document.getElementById('speakText');
            if (speakText) speakText.textContent = '朗读中...';
        }

        utterance.onend = () => {
            if (this.speakBtn) {
                this.speakBtn.classList.remove('speaking');
                const speakText = document.getElementById('speakText');
                if (speakText) speakText.textContent = '朗读';
            }
        };

        utterance.onerror = (e) => {
            if (this.speakBtn) {
                this.speakBtn.classList.remove('speaking');
                const speakText = document.getElementById('speakText');
                if (speakText) speakText.textContent = '朗读';
            }
            // 用户主动取消（如快速切换卡片）不算错误，不提示
            if (e.error !== 'canceled' && e.error !== 'interrupted') {
                console.error('语音朗读错误:', e);
            }
        };

        window.speechSynthesis.speak(utterance);
    }

    speakCurrentCard() {
        if (this.cards.length === 0 || this.currentCardIndex >= this.cards.length) return;
        const card = this.cards[this.currentCardIndex];
        if (card && card.english) {
            // 去除 HTML 标签，保留纯文本朗读
            const plainText = card.english.replace(/<[^>]*>/g, '').replace(/[—–-]+/g, ' ').trim();
            if (plainText) {
                this.speak(plainText);
            }
        }
    }

    updateCardCount() {
        const lines = this.cardInput.value.trim().split('\n').filter(line => line.trim());
        this.cardCount.textContent = `已输入 ${lines.length} 张卡片`;
        
        // 启用/禁用生成按钮
        this.generateBtn.disabled = lines.length === 0;
        if (lines.length === 0) {
            this.generateBtn.style.opacity = '0.5';
            this.generateBtn.style.cursor = 'not-allowed';
        } else {
            this.generateBtn.style.opacity = '1';
            this.generateBtn.style.cursor = 'pointer';
        }

        // 如果只有1张卡片，禁用打乱选项
        if (this.shuffleOption) {
            this.shuffleOption.disabled = lines.length <= 1;
            if (lines.length <= 1) {
                this.shuffleOption.checked = false;
            }
        }
    }

    generateCards() {
        console.log('generateCards function called');
        
        const inputText = this.cardInput.value.trim();
        console.log('Input text:', inputText);
        
        if (!inputText) {
            this.showNotification('请输入学习内容', 'error');
            return;
        }

        const lines = inputText.split('\n').filter(line => line.trim());
        console.log('Parsed lines:', lines);
        
        this.cards = [];
        let validCards = 0;

        lines.forEach((line, index) => {
            line = line.trim();
            if (line) {
                let english, chinese;
                
                console.log('Processing line:', line);
                
                // 方法1: 查找制表符分隔 (推荐)
                if (line.includes('\t')) {
                    const parts = line.split('\t');
                    english = parts[0].trim();
                    chinese = parts.slice(1).join('\t').trim();
                    console.log('Split by tab:', english, '|', chinese);
                }
                // 方法2: 查找特殊分隔符 | 或 ::
                else if (line.includes(' | ')) {
                    const parts = line.split(' | ');
                    english = parts[0].trim();
                    chinese = parts.slice(1).join(' | ').trim();
                    console.log('Split by |:', english, '|', chinese);
                }
                else if (line.includes(' :: ')) {
                    const parts = line.split(' :: ');
                    english = parts[0].trim();
                    chinese = parts.slice(1).join(' :: ').trim();
                    console.log('Split by :::', english, '|', chinese);
                }
                // 方法3: 查找第一个中文或标点符号作为分隔点
                else {
                    const chineseCharPattern = /[\u4e00-\u9fa5，。！？；：""''（）【】《》]/;
                    const match = line.match(chineseCharPattern);
                    
                    if (match) {
                        const splitIndex = match.index;
                        english = line.substring(0, splitIndex).trim();
                        chinese = line.substring(splitIndex).trim();
                        console.log('Split by Chinese char:', english, '|', chinese);
                    } else {
                        //  fallback: 按第一个空格分割
                        const parts = line.split(/\s+/);
                        if (parts.length >= 2) {
                            english = parts[0];
                            chinese = parts.slice(1).join(' ');
                            console.log('Split by space:', english, '|', chinese);
                        } else {
                            console.log('Invalid line format, skipping:', line);
                            return; // 跳过无效行
                        }
                    }
                }

                if (english && chinese) {
                    this.cards.push({
                        id: index,
                        english: english,
                        chinese: chinese,
                        status: 'new' // new, mastered, not_mastered
                    });
                    validCards++;
                    console.log('Added card:', english, '->', chinese);
                }
            }
        });

        console.log('Total valid cards:', validCards);

        // 过滤掉已斩词的卡片
        const banished = this.getBanishedCards();
        const beforeFilter = this.cards.length;
        this.cards = this.cards.filter(card => {
            return !banished.some(b => b.english === card.english && b.chinese === card.chinese);
        });
        const afterFilter = this.cards.length;
        if (beforeFilter > afterFilter) {
            this.showNotification(`已过滤 ${beforeFilter - afterFilter} 个已斩词卡片`, 'info');
        }

        if (this.cards.length === 0) {
            this.showNotification('请输入有效的双语内容（或检查是否全部被斩词）', 'error');
            return;
        }

        // 根据用户选择决定是否打乱卡片
        if (this.shuffleOption && this.shuffleOption.checked) {
            this.shuffleCards();
        }

        this.startStudy();
    }

    startStudy() {
        // 切换到学习界面
        this.inputSection.style.display = 'none';
        this.studySection.style.display = 'block';
        this.shuffleBtn.style.display = 'inline-flex';
        this.utilityButtons.style.display = 'flex'; // 显示工具按钮
        
        // 初始化学习状态
        this.currentCardIndex = 0;
        this.currentRound = 1;
        this.masteredCards = [];
        this.notMasteredCards = [];
        this.totalAttempts = 0; // 重置累计总尝试次数
        this.isFlipped = false;
        this.lastProcessedCard = null; // 重置撤销记录

        this.updateProgress();
        this.displayCurrentCard();
        this.showNotification('开始学习！点击卡片查看中文', 'success');
    }

    adjustFontSize() {
        const englishLength = this.englishText.textContent.length;
        const chineseLength = this.chineseText.textContent.length;
        const maxLength = Math.max(englishLength, chineseLength);
        
        let fontSize = 2.25;
        
        if (maxLength > 80) {
            fontSize = 1.2;
        } else if (maxLength > 60) {
            fontSize = 1.5;
        } else if (maxLength > 40) {
            fontSize = 1.8;
        } else if (maxLength > 25) {
            fontSize = 2.0;
        }
        
        this.englishText.style.fontSize = fontSize + 'rem';
        this.chineseText.style.fontSize = fontSize + 'rem';
        
        if (fontSize < 1.5) {
            this.englishText.style.lineHeight = '1.3';
            this.chineseText.style.lineHeight = '1.3';
        } else {
            this.englishText.style.lineHeight = '1.4';
            this.chineseText.style.lineHeight = '1.4';
        }
    }

    displayCurrentCard() {
        this.updateProgress();
        if (this.currentCardIndex >= this.cards.length) {
            this.endRound();
            return;
        }

        const card = this.cards[this.currentCardIndex];
        
        // 完全重置卡片状态
        this.isFlipped = false;
        this.studyCard.classList.remove('flipped');
        this.controlButtons.style.display = 'none';
        if (this.speakBtnWrapper) this.speakBtnWrapper.style.display = 'flex';
        if (this.frontQuickButtons) this.frontQuickButtons.style.display = 'flex';

        // 确保卡片完全隐藏和重置
        anime.set(this.studyCard, {
            opacity: 0,
            translateX: 0,
            scale: 1,
            rotateY: 0
        });
        
        // 新增：控制撤销按钮状态
        this.undoBtn.disabled = !this.lastProcessedCard;
        this.undoBtn.style.opacity = this.lastProcessedCard ? '1' : '0.5';
        this.undoBtn.style.cursor = this.lastProcessedCard ? 'pointer' : 'not-allowed';

        // 新增：处理多句对话格式
        const formatDialog = (text) => {
            // 匹配各种破折号格式：——、—、--- 并在每个标记前添加换行（第一个除外）
            return text.replace(/(——|—|---)(?!$)/g, (match, offset) => {
                return offset === 0 ? match : `<br>${match}`;
            });
        };

        // 新增：检测是否为对话（包含多个破折号）
        const isDialogue = (text) => {
            const dialogPattern = /(——|—|---)/g;
            const matches = text.match(dialogPattern);
            return matches && matches.length > 1;
        };

        // 更新卡片内容（使用 innerHTML 而不是 textContent）
        this.englishText.innerHTML = formatDialog(card.english);
        this.chineseText.innerHTML = formatDialog(card.chinese);

        // 根据是否为对话添加或移除左对齐样式
        if (isDialogue(card.english)) {
            this.englishText.classList.add('dialogue-content');
            this.chineseText.classList.add('dialogue-content');
        } else {
            this.englishText.classList.remove('dialogue-content');
            this.chineseText.classList.remove('dialogue-content');
        }

        // 调整字体大小
        this.adjustFontSize();

        // 设置卡片进入动画
        anime({
            targets: this.studyCard,
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuart'
        });

        // 自动朗读（如果开启）
        if (this.autoSpeakOption && this.autoSpeakOption.checked) {
            setTimeout(() => {
                this.speakCurrentCard();
            }, 500); // 等卡片淡入动画完成后再朗读
        }
    }

    flipCard() {
        console.log('Flip card called, isFlipped:', this.isFlipped);
        if (this.isFlipped) return;

        this.isFlipped = true;
        this.studyCard.classList.add('flipped');
        console.log('Card flipped class added');

        // 翻转后隐藏朗读按钮和正面快捷按钮
        if (this.speakBtnWrapper) this.speakBtnWrapper.style.display = 'none';
        if (this.frontQuickButtons) this.frontQuickButtons.style.display = 'none';

        // 显示控制按钮
        setTimeout(() => {
            this.controlButtons.style.display = 'flex';
            anime({
                targets: this.controlButtons,
                opacity: [0, 1],
                translateY: [20, 0],
                duration: 400,
                easing: 'easeOutQuart'
            });
        }, 300);

        this.playSound('flip');
    }

    markMastered() {
        const card = this.cards[this.currentCardIndex];
        card.status = 'mastered';
        this.masteredCards.push(card);
        
        // 新增：记录上一个处理的卡片
        this.lastProcessedCard = {
            card: card,
            index: this.currentCardIndex,
            type: 'mastered'
        };
        
        this.playSound('success');
        this.showNotification('很好！已标记为已掌握', 'success');
        
        this.switchToNextCard('mastered');
    }

    markNotMastered() {
        const card = this.cards[this.currentCardIndex];
        card.status = 'not_mastered';
        this.notMasteredCards.push(card);

        // 记录到本地存储的错题本
        this.recordMistake(card);

        // 新增：记录上一个处理的卡片
        this.lastProcessedCard = {
            card: card,
            index: this.currentCardIndex,
            type: 'not_mastered'
        };

        this.playSound('warning');
        this.showNotification('没关系，下一轮继续练习', 'info');

        this.switchToNextCard('not_mastered');
    }

    markBanished() {
        const card = this.cards[this.currentCardIndex];

        // 加入斩词本
        this.banishCard(card);

        // 从当前卡片列表中移除
        this.cards.splice(this.currentCardIndex, 1);

        // 记录上一个处理的卡片（用于撤销）
        this.lastProcessedCard = {
            card: card,
            index: this.currentCardIndex,
            type: 'banished'
        };

        this.playSound('success');
        this.showNotification('已斩词！该卡片将不再出现在测试中', 'success');

        // 不增加 currentCardIndex，因为已移除当前卡片，下一个卡片会顶替当前位置
        this.switchToNextCard('banished');
    }

    // 记录错题到本地存储
    recordMistake(card) {
        try {
            let mistakes = JSON.parse(localStorage.getItem(STORAGE_KEYS.MISTAKES) || '[]');

            // 查找是否已存在该卡片
            const existingIndex = mistakes.findIndex(m => m.english === card.english && m.chinese === card.chinese);

            if (existingIndex !== -1) {
                // 已存在，增加错误次数
                mistakes[existingIndex].count = (mistakes[existingIndex].count || 1) + 1;
                mistakes[existingIndex].lastWrongAt = new Date().toISOString();
            } else {
                // 新错题
                mistakes.push({
                    english: card.english,
                    chinese: card.chinese,
                    count: 1,
                    firstWrongAt: new Date().toISOString(),
                    lastWrongAt: new Date().toISOString()
                });
            }

            localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(mistakes));
        } catch (e) {
            console.error('记录错题失败:', e);
        }
    }

    // 从本地存储读取错题本
    getMistakes() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.MISTAKES) || '[]');
        } catch (e) {
            console.error('读取错题本失败:', e);
            return [];
        }
    }

    // 清空错题本
    clearMistakes() {
        localStorage.removeItem(STORAGE_KEYS.MISTAKES);
        this.showNotification('错题本已清空', 'success');
    }

    // ==================== 斩词功能 ====================

    // 将卡片加入斩词本（纯存储，通知由调用方统一发出）
    banishCard(card) {
        try {
            let banished = JSON.parse(localStorage.getItem(STORAGE_KEYS.BANISHED) || '[]');

            // 已存在则跳过，避免重复写入
            const exists = banished.some(b => b.english === card.english && b.chinese === card.chinese);
            if (exists) return;

            banished.push({
                english: card.english,
                chinese: card.chinese,
                banishedAt: new Date().toISOString()
            });

            localStorage.setItem(STORAGE_KEYS.BANISHED, JSON.stringify(banished));
        } catch (e) {
            console.error('斩词失败:', e);
        }
    }

    // 从斩词本移除
    unbanishCard(card) {
        try {
            let banished = this.getBanishedCards();
            banished = banished.filter(b => !(b.english === card.english && b.chinese === card.chinese));
            localStorage.setItem(STORAGE_KEYS.BANISHED, JSON.stringify(banished));
            this.showNotification('已取消斩词', 'success');
        } catch (e) {
            console.error('取消斩词失败:', e);
        }
    }

    // 读取斩词本
    getBanishedCards() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEYS.BANISHED) || '[]');
        } catch (e) {
            console.error('读取斩词本失败:', e);
            return [];
        }
    }

    // 清空斩词本
    clearBanished() {
        localStorage.removeItem(STORAGE_KEYS.BANISHED);
        this.showNotification('斩词本已清空', 'success');
    }

    // 检查卡片是否已被斩
    isBanished(card) {
        const banished = this.getBanishedCards();
        return banished.some(b => b.english === card.english && b.chinese === card.chinese);
    }

    switchToNextCard(type) {
        // 斩词时已移除当前卡片，不需要增加索引
        if (type !== 'banished') {
            this.currentCardIndex++;
        }

        // 隐藏控制按钮和正面快捷按钮
        this.controlButtons.style.display = 'none';
        if (this.frontQuickButtons) this.frontQuickButtons.style.display = 'none';

        // 确保卡片回到正面状态
        this.studyCard.classList.remove('flipped');
        this.isFlipped = false;
        
        // 直接淡出当前卡片
        anime({
            targets: this.studyCard,
            opacity: [1, 0],
            duration: 200,
            easing: 'easeOutQuart',
            complete: () => {
                // 完全重置卡片状态
                anime.set(this.studyCard, {
                    opacity: 0,
                    translateX: 0,
                    scale: 1
                });
                
                // 延迟显示新卡片
                setTimeout(() => {
                    this.displayCurrentCard();
                }, 50);
            }
        });

        this.updateProgress();
    }

    endRound() {
        // 累加本轮尝试次数到总尝试次数
        this.totalAttempts += this.masteredCards.length + this.notMasteredCards.length;

        // 全部掌握 → 直接完成
        if (this.notMasteredCards.length === 0) {
            this.completeStudy();
            return;
        }
        this.showEndRoundModal();
    }

    showEndRoundModal() {
        if (!this.endRoundModal) {
            this.createEndRoundModal();
        }

        const totalInRound = this.masteredCards.length + this.notMasteredCards.length;
        const accuracy = totalInRound > 0 ? Math.round((this.masteredCards.length / totalInRound) * 100) : 0;
        
        const modal = this.endRoundModal.querySelector('.modal-content');
        modal.querySelector('#roundNumber').textContent = this.currentRound;
        modal.querySelector('#roundTotalCards').textContent = totalInRound;
        modal.querySelector('#roundMasteredCount').textContent = this.masteredCards.length;
        modal.querySelector('#roundNotMasteredCount').textContent = this.notMasteredCards.length;
        modal.querySelector('#roundAccuracy').textContent = accuracy + '%';

        const testNotMasteredBtn = modal.querySelector('#testNotMasteredBtn');
        if (this.notMasteredCards.length === 0) {
            testNotMasteredBtn.style.display = 'none';
        } else {
            testNotMasteredBtn.style.display = 'inline-flex';
        }

        this.endRoundModal.style.display = 'flex';
        
        anime({
            targets: '.modal-content',
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 400,
            easing: 'easeOutElastic(1, .8)'
        });
    }

    createEndRoundModal() {
        this.endRoundModal = document.createElement('div');
        this.endRoundModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        this.endRoundModal.style.display = 'none';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content bg-white rounded-2xl shadow-2xl max-w-md mx-4 p-6 transform transition-all';
        
        modalContent.innerHTML = `
            <div class="text-center">
                <div class="text-5xl mb-4">🎯</div>
                <h3 class="text-2xl font-bold text-gray-800 mb-4">
                    第 <span id="roundNumber">${this.currentRound}</span> 轮学习完成！
                </h3>
                
                <div class="bg-gray-50 rounded-lg p-4 mb-6">
                    <div class="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div class="text-xl font-bold text-blue-600" id="roundTotalCards">0</div>
                            <div class="text-sm text-gray-600">本轮卡片</div>
                        </div>
                        <div>
                            <div class="text-xl font-bold text-green-600" id="roundMasteredCount">0</div>
                            <div class="text-sm text-gray-600">已掌握</div>
                        </div>
                        <div>
                            <div class="text-xl font-bold text-red-500" id="roundNotMasteredCount">0</div>
                            <div class="text-sm text-gray-600">待复习</div>
                        </div>
                        <div>
                            <div class="text-xl font-bold text-orange-500" id="roundAccuracy">0%</div>
                            <div class="text-sm text-gray-600">掌握率</div>
                        </div>
                    </div>
                </div>
                
                <div class="mb-4">
                    <p class="text-sm text-gray-600 mb-3">请选择下一轮的学习内容：</p>
                    <div class="flex gap-3 justify-center">
                        <button id="testAllBtn" class="btn-primary text-white px-5 py-2 rounded-lg font-medium text-sm">
                            <span class="mr-1">📚</span>
                            测试全部内容
                        </button>
                        <button id="testNotMasteredBtn" class="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors">
                            <span class="mr-1">🎯</span>
                            只测未掌握内容
                        </button>
                    </div>
                </div>
                
                <button id="clearAndRestartBtn" class="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors mt-3">
                    清空当前卡片，学习新内容
                </button>
            </div>
        `;
        
        this.endRoundModal.appendChild(modalContent);
        document.body.appendChild(this.endRoundModal);
        
        document.getElementById('testAllBtn').addEventListener('click', () => this.startNextRound('all'));
        document.getElementById('testNotMasteredBtn').addEventListener('click', () => this.startNextRound('notMastered'));
        document.getElementById('clearAndRestartBtn').addEventListener('click', () => {
            this.closeEndRoundModal();
            this.restart();
        });
        
        this.endRoundModal.addEventListener('click', (e) => {
            if (e.target === this.endRoundModal) {
                this.closeEndRoundModal();
            }
        });
    }

    closeEndRoundModal() {
        if (!this.endRoundModal) return;
        
        anime({
            targets: '.modal-content',
            scale: [1, 0.8],
            opacity: [1, 0],
            duration: 300,
            easing: 'easeInQuart',
            complete: () => {
                this.endRoundModal.style.display = 'none';
            }
        });
    }

    startNextRound(mode) {
        this.closeEndRoundModal();
        
        if (mode === 'all') {
            this.cards = [...this.masteredCards, ...this.notMasteredCards];
            this.cards.forEach(card => {
                if (card.status === 'mastered') {
                    card.status = 'new';
                }
            });
            this.masteredCards = [];
            this.notMasteredCards = [];
        } else if (mode === 'notMastered') {
            this.cards = [...this.notMasteredCards];
            this.notMasteredCards = [];
            this.masteredCards = [];
        }

        this.currentRound++;
        this.roundCount.textContent = this.currentRound;

        this.shuffleCards();

        this.currentCardIndex = 0;
        this.displayCurrentCard();
        
        this.showNotification(`第 ${this.currentRound} 轮开始！`, 'info');
    }

    completeStudy() {
        this.studySection.style.display = 'none';
        this.completionSection.style.display = 'block';

        // 当前完成这一轮的卡片数量
        const currentRoundTotal = this.masteredCards.length + this.notMasteredCards.length;

        // 完成时，未掌握数量应该为 0，因此这里通常等于 100%
        const currentRoundAccuracy = currentRoundTotal > 0
            ? Math.round((this.masteredCards.length / currentRoundTotal) * 100)
            : 0;

        this.finalCardCount.textContent = this.masteredCards.length;
        this.totalRounds.textContent = this.currentRound;
        this.efficiency.textContent = currentRoundAccuracy + '%';
        
        anime({
            targets: '.celebration',
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 1000,
            easing: 'easeOutElastic(1, .8)'
        });

        this.playSound('celebration');
        this.showNotification('🎉 恭喜完成所有学习内容！', 'success');
    }
    

    updateProgress() {
        const total = this.masteredCards.length + this.notMasteredCards.length + 
                     (this.cards.length - this.currentCardIndex);
        const completed = this.masteredCards.length + this.notMasteredCards.length;
        const progress = total > 0 ? (completed / total) * 100 : 0;
        
        this.currentProgress.textContent = completed;
        this.totalCards.textContent = total;
        this.progressBar.style.width = progress + '%';
        
        this.masteredCount.textContent = this.masteredCards.length;
        this.notMasteredCount.textContent = this.notMasteredCards.length;
        this.roundCount.textContent = this.currentRound;
    }

    shuffleCards() {
        if (this.cards.length === 0) return;
        
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
        
        if (this.studySection.style.display !== 'none') {
            this.showNotification('卡片已重新排序', 'info');
        }
    }

    restart() {
        this.cards = [];
        this.currentCardIndex = 0;
        this.currentRound = 1;
        this.masteredCards = [];
        this.notMasteredCards = [];
        this.isFlipped = false;
        this.lastProcessedCard = null;
        
        this.completionSection.style.display = 'none';
        this.studySection.style.display = 'none';
        this.inputSection.style.display = 'block';
        this.shuffleBtn.style.display = 'none';
        this.utilityButtons.style.display = 'none'; // 隐藏工具按钮
        
        this.cardInput.value = '';
        this.updateCardCount();
        
        this.showNotification('已重置，可以开始新的学习', 'info');
    }

    handleKeyboard(e) {
        if (this.studySection.style.display === 'none') return;
        
        // 新增：Ctrl+Z 撤销快捷键
        if (e.ctrlKey && e.key === 'z' && this.utilityButtons.style.display !== 'none') {
            e.preventDefault();
            this.undoLastSelection();
            return;
        }
        
        switch(e.key) {
            case ' ':
                e.preventDefault();
                if (!this.isFlipped) {
                    this.flipCard();
                }
                break;
            case '1':
                if (this.isFlipped) {
                    this.markMastered();
                }
                break;
            case '2':
                if (this.isFlipped) {
                    this.markNotMastered();
                }
                break;
            case 'Escape':
                if (this.isFlipped) {
                    this.studyCard.classList.remove('flipped');
                    this.isFlipped = false;
                    this.controlButtons.style.display = 'none';
                    if (this.speakBtnWrapper) this.speakBtnWrapper.style.display = 'flex';
                }
                break;
        }
    }

    playSound(type) {
        try {
            // 单例创建：首次调用时初始化，后续复用
            if (!this.audioContext) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return; // 浏览器不支持则静默跳过
                this.audioContext = new AudioCtx();
            }
            // 浏览器自动挂起策略：用户交互后需要 resume
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const ctx = this.audioContext;
            switch (type) {
                case 'success':
                    this.playTone(ctx, 800, 0.1, 200);
                    break;
                case 'flip':
                    this.playTone(ctx, 400, 0.05, 100);
                    break;
                case 'warning':
                    this.playTone(ctx, 300, 0.1, 300);
                    break;
                case 'celebration':
                    this.playTone(ctx, 600, 0.2, 500);
                    setTimeout(() => this.playTone(ctx, 800, 0.2, 500), 200);
                    break;
            }
        } catch (e) {
            console.error('播放音效失败:', e);
        }
    }

    playTone(audioContext, frequency, volume, duration) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
        
        switch(type) {
            case 'success':
                notification.classList.add('bg-green-500', 'text-white');
                break;
            case 'error':
                notification.classList.add('bg-red-500', 'text-white');
                break;
            case 'warning':
                notification.classList.add('bg-yellow-500', 'text-white');
                break;
            default:
                notification.classList.add('bg-blue-500', 'text-white');
        }
        
        notification.innerHTML = `
            <div class="flex items-center">
                <span class="mr-2">${this.getNotificationIcon(type)}</span>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    getNotificationIcon(type) {
        switch(type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
    }

    async copyAIPrompt() {
        const promptText = `请从输入文本中提取所有"英文-中文"对照的内容，并按以下规则处理：
1.识别与提取：准确找出文本中所有明确的、成对的英文内容及其对应的中文翻译。包括：
单词/短语：英文单词与其中文释义。
完整句子或对话：独立的句子或成组的对话。
2.核心处理规则：
针对对话：如果同一个编号（如1. 2. 3.）下包含多句对话（通常以"——"引入），请将其中所有英文对话合并为一个整体，并将其所有对应的中文翻译合并为另一个整体。
格式：使用一个"——"开头，将所有英文句子（包括中间的"——"）按原文顺序连接，然后输入分隔符" | "，最后使用一个"——"开头，将所有对应的中文句子按原文顺序连接。
示例：
原文：3.——Is this a puppy? ——这是一只小狗吗？ ——No, it isn't. ——不，它不是。
输出：——Is this a puppy? ——No, it isn't. | ——这是一只小狗吗？ ——不，它不是。
针对其他内容：对于词汇、短语或独立的单句，将每一组英文与中文直接配对，移除开头的编号、星号(*)、连字符(-)等引导符号。
3.清理与格式化：
移除所有配对内容前的引导符号（如编号1.、2.，符号*、-），但保留配对内容内部的标点。
每一对（或每一组合并后的对话）独占一行。
每行格式为：[英文内容] | [中文内容]。
确保竖线"|"的前后各有一个空格。
4.最终输出：仅输出按上述要求格式化的行，不包含任何额外的标题、说明、章节名称或其他无关文本。`;

        // 优先使用现代异步剪贴板 API（需 HTTPS 或 localhost 等安全上下文）
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(promptText);
                this.showCopySuccessModal();
                return;
            } catch (err) {
                console.warn('Clipboard API 失败，尝试降级方案:', err);
            }
        }

        // 降级方案：旧版 execCommand
        const tempTextarea = document.createElement('textarea');
        tempTextarea.value = promptText;
        tempTextarea.style.position = 'fixed';
        tempTextarea.style.opacity = '0';
        document.body.appendChild(tempTextarea);
        tempTextarea.select();

        try {
            const successful = document.execCommand('copy');
            document.body.removeChild(tempTextarea);
            if (successful) {
                this.showCopySuccessModal();
            } else {
                this.showNotification('复制失败，请手动复制', 'error');
            }
        } catch (err) {
            console.error('复制失败:', err);
            if (document.body.contains(tempTextarea)) document.body.removeChild(tempTextarea);
            this.showNotification('复制失败，请手动复制', 'error');
        }
    }

    showCopySuccessModal() {
        if (!this.aiPromptModal) {
            this.createPromptModal();
        }
        
        this.aiPromptModal.style.display = 'flex';
        
        anime({
            targets: '.modal-content',
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 400,
            easing: 'easeOutElastic(1, .8)'
        });
    }

    createPromptModal() {
        this.aiPromptModal = document.createElement('div');
        this.aiPromptModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        this.aiPromptModal.style.display = 'none';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content bg-white rounded-2xl shadow-2xl max-w-lg mx-4 p-6 transform transition-all';
        
        modalContent.innerHTML = `
            <div class="text-center">
                <div class="text-5xl mb-4">✨</div>
                <h3 class="text-2xl font-bold text-gray-800 mb-4">
                    AI提示词已复制到剪贴板！
                </h3>
                
                <div class="text-left bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 class="font-semibold text-gray-700 mb-3">使用步骤：</h4>
                    <ol class="space-y-2 text-sm text-gray-600">
                        <li class="flex items-start">
                            <span class="text-blue-500 font-bold mr-2">1.</span>
                            <span>准备好需要转换的内容（文本、截图或拍照）</span>
                        </li>
                        <li class="flex items-start">
                            <span class="text-blue-500 font-bold mr-2">2.</span>
                            <span>打开AI应用（如元宝、豆包、Kimi等）</span>
                        </li>
                        <li class="flex items-start">
                            <span class="text-blue-500 font-bold mr-2">3.</span>
                            <span><b>粘贴刚才复制的提示词</b>，并附上您的学习内容</span>
                        </li>
                        <li class="flex items-start">
                            <span class="text-blue-500 font-bold mr-2">4.</span>
                            <span>将AI返回的格式化结果<b>粘贴回本页面的输入框</b></span>
                        </li>
                        <li class="flex items-start">
                            <span class="text-blue-500 font-bold mr-2">5.</span>
                            <span>点击"生成学习卡片"开始您的学习之旅！</span>
                        </li>
                    </ol>
                </div>
                
                <div class="flex gap-3 justify-center">
                    <button id="closeModalBtn" class="btn-primary text-white px-6 py-2 rounded-lg font-medium">
                        知道了
                    </button>
                    <button id="viewExampleBtn" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors">
                        查看示例
                    </button>
                </div>
            </div>
        `;
        
        this.aiPromptModal.appendChild(modalContent);
        document.body.appendChild(this.aiPromptModal);
        
        const closeBtn = document.getElementById('closeModalBtn');
        const viewExampleBtn = document.getElementById('viewExampleBtn');
        
        closeBtn.addEventListener('click', () => this.closeModal());
        viewExampleBtn.addEventListener('click', () => {
            this.showExample();
            this.closeModal();
        });
        
        this.aiPromptModal.addEventListener('click', (e) => {
            if (e.target === this.aiPromptModal) {
                this.closeModal();
            }
        });
    }

    closeModal() {
        if (!this.aiPromptModal) return;
        
        anime({
            targets: '.modal-content',
            scale: [1, 0.8],
            opacity: [1, 0],
            duration: 300,
            easing: 'easeInQuart',
            complete: () => {
                this.aiPromptModal.style.display = 'none';
            }
        });
    }

    showExample() {
        const exampleText = `
red | 红色的
look at | 看......
A red balloon, please. | 请给我一个红色的气球
It's a book. | 它是一本书
`;

        this.cardInput.value = exampleText;
        this.updateCardCount();
        
        this.showNotification('示例已加载！请删除示例内容后粘贴您的AI结果', 'success');
    }

    showInstructionsModal() {
        if (!this.instructionsModal) {
            this.createInstructionsModal();
        }

        this.instructionsModal.style.display = 'flex';
        
        anime({
            targets: '.instructions-content',
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 400,
            easing: 'easeOutElastic(1, .8)'
        });
    }

    createInstructionsModal() {
        this.instructionsModal = document.createElement('div');
        this.instructionsModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        this.instructionsModal.style.display = 'none';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'instructions-content bg-white rounded-2xl shadow-2xl max-w-2xl mx-4 p-6 transform transition-all max-h-[80vh] overflow-y-auto';
        
        modalContent.innerHTML = `
            <div class="text-center mb-6">
                <div class="text-5xl mb-4">📖</div>
                <h3 class="text-2xl font-bold text-gray-800">双语认读卡片助手 - 使用说明</h3>
            </div>
            
            <div class="text-left space-y-6 text-gray-700">
                <div>
                    <h4 class="font-bold text-lg mb-2 flex items-center">
                        <span class="text-blue-500 mr-2">🎯</span>
                        主要功能
                    </h4>
                    <p class="text-sm">这是一个帮助您学习双语词汇的智能工具，通过翻转卡片的方式加深记忆，自动记录学习进度。</p>
                </div>
                
                <div>
                    <h4 class="font-bold text-lg mb-2 flex items-center">
                        <span class="text-green-500 mr-2">📝</span>
                        使用方法
                    </h4>
                    <ol class="text-sm space-y-1 ml-5 list-decimal">
                        <li>在输入框中填写英文-中文对照内容（每行一个）</li>
                        <li>支持多种分隔格式：竖线"|"、双冒号"::"、制表符或空格</li>
                        <li>点击"生成学习卡片"开始学习</li>
                        <li>点击卡片翻转查看中文翻译</li>
                        <li>根据自身掌握情况选择"已掌握"或"未掌握"</li>
                        <li>系统会自动安排未掌握卡片进入下一轮复习</li>
                    </ol>
                </div>
                
                <div>
                    <h4 class="font-bold text-lg mb-2 flex items-center">
                        <span class="text-purple-500 mr-2">🤖</span>
                        AI辅助输入
                    </h4>
                    <p class="text-sm mb-2">点击"一键复制AI提示词"按钮，可将专业提示词复制到剪贴板，然后发送给AI助手（如Kimi、豆包等），AI会自动将您的学习材料转换为标准格式。</p>
                </div>

                <div>
                    <h4 class="font-bold text-lg mb-2 flex items-center">
                        <span class="text-indigo-500 mr-2">📥</span>
                        导入认读过关纸
                    </h4>
                    <p class="text-sm mb-2">点击"导入认读过关纸"按钮，可直接加载预置的Unit 1-8单元内容，无需手动输入。</p>
                </div>

                <div>
                    <h4 class="font-bold text-lg mb-2 flex items-center">
                        <span class="text-yellow-500 mr-2">↩️</span>
                        撤销选择功能
                    </h4>
                    <p class="text-sm mb-2">如果您误选了"已掌握"或"未掌握"，可以点击"撤销选择"按钮回到上一个单词，重新进行选择。支持快捷键 Ctrl+Z。</p>
                </div>

                <div>
                    <h4 class="font-bold text-lg mb-2 flex items-center">
                        <span class="text-orange-500 mr-2">✋</span>
                        结束学习选项
                    </h4>
                    <p class="text-sm mb-2">学到一半想暂停时，点击"结束学习"按钮，可选择重新学习全部内容、仅学习未掌握词汇，或返回主页。</p>
                </div>
                
                <div>
                    <h4 class="font-bold text-lg mb-2 flex items-center">
                        <span class="text-red-500 mr-2">💡</span>
                        学习建议
                    </h4>
                    <ul class="text-sm space-y-1 ml-5 list-disc">
                        <li>对于难记的词汇，可多次标记"未掌握"进行重复练习</li>
                        <li>善用"随机排序"功能，避免顺序记忆</li>
                        <li>可导入课本、PDF、截图等多种学习材料</li>
                    </ul>
                </div>

                <div>
                    <h4 class="font-bold text-lg mb-2 flex items-center">
                        <span class="text-yellow-500 mr-2">⌨️</span>
                        快捷键
                    </h4>
                    <ul class="text-sm space-y-1 ml-5 list-disc">
                        <li>空格键 - 翻转卡片</li>
                        <li>1 - 标记为已掌握</li>
                        <li>2 - 标记为未掌握</li>
                        <li>Esc - 翻转回正面</li>
                        <li><b>Ctrl+Z - 撤销上次选择</b></li>
                    </ul>
                </div>
            </div>
            
            <div class="flex gap-3 justify-center mt-6">
                <button id="closeInstructionsBtn" class="btn-primary text-white px-6 py-2 rounded-lg font-medium">
                    关闭
                </button>
                <button id="loadExampleBtn" class="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    加载示例
                </button>
            </div>
        `;
        
        this.instructionsModal.appendChild(modalContent);
        document.body.appendChild(this.instructionsModal);
        
        document.getElementById('closeInstructionsBtn').addEventListener('click', () => this.closeInstructionsModal());
        document.getElementById('loadExampleBtn').addEventListener('click', () => {
            this.loadSampleData();
            this.closeInstructionsModal();
        });
        
        this.instructionsModal.addEventListener('click', (e) => {
            if (e.target === this.instructionsModal) {
                this.closeInstructionsModal();
            }
        });
    }

    loadSampleData() {
        const sampleData = `look | 看
look at... | 看......
it's=it is | 它是
A red balloon, please. | 请给我一个红色的气球
hello | 你好
thank you | 谢谢
good morning | 早上好
how are you | 你好吗
what is this | 这是什么
I love you | 我爱你`;
        
        this.cardInput.value = sampleData;
        this.updateCardCount();
    }

    closeInstructionsModal() {
        if (!this.instructionsModal) return;
        
        anime({
            targets: '.instructions-content',
            scale: [1, 0.8],
            opacity: [1, 0],
            duration: 300,
            easing: 'easeInQuart',
            complete: () => {
                this.instructionsModal.style.display = 'none';
            }
        });
    }

    showUnitModal() {
        if (!this.unitModal) {
            this.createUnitModal();
        }
        
        this.unitModal.style.display = 'flex';
        
        anime({
            targets: '.unit-modal-content',
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 400,
            easing: 'easeOutElastic(1, .8)'
        });
    }

    createUnitModal() {
        this.unitModal = document.getElementById('unitModal');
        this.unitLoading = document.getElementById('unitLoading');
        
        const unitBtns = this.unitModal.querySelectorAll('.unit-btn');
        unitBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const unit = e.target.dataset.unit;
                this.loadUnitContent(unit);
            });
        });
        
        document.getElementById('closeUnitModalBtn').addEventListener('click', () => {
            this.closeUnitModal();
        });
        
        this.unitModal.addEventListener('click', (e) => {
            if (e.target === this.unitModal) {
                this.closeUnitModal();
            }
        });
    }

    async loadUnitContent(unitName) {
        this.unitLoading.style.display = 'block';
        
        try {
            const response = await fetch('./data/units.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            const unitData = data[unitName];
            
            if (!unitData || unitData.length === 0) {
                throw new Error('该单元暂无内容');
            }
            
            const formattedText = unitData.map(item => 
                `${item.english} | ${item.chinese}`
            ).join('\n');
            
            this.cardInput.value = formattedText;
            this.updateCardCount();
            
            this.closeUnitModal();
            
            this.showNotification(`成功导入 ${unitName.toUpperCase()}！共 ${unitData.length} 张卡片`, 'success');
            
            this.cardInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
        } catch (error) {
            console.error('加载单元内容失败:', error);
            this.showNotification(`加载失败: ${error.message}`, 'error');
        } finally {
            this.unitLoading.style.display = 'none';
        }
    }

    closeUnitModal() {
        if (!this.unitModal) return;
        
        anime({
            targets: '.unit-modal-content',
            scale: [1, 0.8],
            opacity: [1, 0],
            duration: 300,
            easing: 'easeInQuart',
            complete: () => {
                this.unitModal.style.display = 'none';
            }
        });
    }

    // ==================== 新增功能方法 ====================

    // 撤销上次选择（支持 mastered / not_mastered / banished 三种类型的完整回滚）
    undoLastSelection() {
        if (!this.lastProcessedCard) {
            this.showNotification('没有可撤销的操作', 'warning');
            return;
        }

        const { card, index, type } = this.lastProcessedCard;

        if (type === 'mastered') {
            const i = this.masteredCards.findIndex(c => c.id === card.id);
            if (i !== -1) this.masteredCards.splice(i, 1);
            card.status = 'new';
            this.currentCardIndex--; // markMastered 时做过 ++，需回退
        } else if (type === 'not_mastered') {
            const i = this.notMasteredCards.findIndex(c => c.id === card.id);
            if (i !== -1) this.notMasteredCards.splice(i, 1);
            // 同步回滚错题本：撤销误标的"未掌握"
            this.rollbackMistake(card);
            card.status = 'new';
            this.currentCardIndex--; // markNotMastered 时做过 ++，需回退
        } else if (type === 'banished') {
            // 斩词时是从 cards 中 splice 移除的，需重新插回原位置
            card.status = 'new';
            this.cards.splice(index, 0, card);
            // 从斩词本中静默移除，避免重复提示
            this.silentUnbanish(card);
            // 斩词时未做 ++，因此撤销时不需要 --
        }

        // 清除撤销记录（仅支持单步撤销）
        this.lastProcessedCard = null;

        this.updateProgress();
        this.displayCurrentCard();

        this.showNotification('已撤销上次选择，请重新判断', 'info');
    }

    // 回滚一次错题记录：count 减 1，减到 0 则整条移除
    rollbackMistake(card) {
        try {
            const key = STORAGE_KEYS.MISTAKES;
            let mistakes = JSON.parse(localStorage.getItem(key) || '[]');
            const idx = mistakes.findIndex(m => m.english === card.english && m.chinese === card.chinese);
            if (idx !== -1) {
                const cur = (mistakes[idx].count || 1) - 1;
                if (cur <= 0) {
                    mistakes.splice(idx, 1);
                } else {
                    mistakes[idx].count = cur;
                }
                localStorage.setItem(key, JSON.stringify(mistakes));
            }
        } catch (e) {
            console.error('回滚错题失败:', e);
        }
    }

    // 静默取消斩词（不弹通知，用于撤销场景）
    silentUnbanish(card) {
        try {
            let banished = this.getBanishedCards();
            banished = banished.filter(b => !(b.english === card.english && b.chinese === card.chinese));
            localStorage.setItem(STORAGE_KEYS.BANISHED, JSON.stringify(banished));
        } catch (e) {
            console.error('取消斩词失败:', e);
        }
    }

    // 显示结束学习确认模态框
    showEndStudyModal() {
        if (!this.endStudyModal) {
            this.createEndStudyModal();
        }
        
        // 更新模态框中的统计数据
        const modal = this.endStudyModal.querySelector('.end-study-content');
        modal.querySelector('#modalMasteredCount').textContent = this.masteredCards.length;
        modal.querySelector('#modalNotMasteredCount').textContent = this.notMasteredCards.length;
        modal.querySelector('#modalRemainingCount').textContent = this.cards.length - this.currentCardIndex;
        
        // 控制"只学未掌握"按钮的显示
        const studyNotMasteredBtn = document.getElementById('studyNotMasteredBtn');
        studyNotMasteredBtn.style.display = this.notMasteredCards.length > 0 ? 'inline-flex' : 'none';
        
        this.endStudyModal.style.display = 'flex';
        
        anime({
            targets: '.end-study-content',
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 400,
            easing: 'easeOutElastic(1, .8)'
        });
    }

    // 创建结束学习模态框
    createEndStudyModal() {
        this.endStudyModal = document.createElement('div');
        this.endStudyModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        this.endStudyModal.style.display = 'none';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'end-study-content bg-white rounded-2xl shadow-2xl max-w-md mx-4 p-6 transform transition-all';
        
        modalContent.innerHTML = `
            <div class="text-center">
                <div class="text-5xl mb-4">✋</div>
                <h3 class="text-2xl font-bold text-gray-800 mb-4">
                    确定要结束当前学习吗？
                </h3>
                
                <div class="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                    <p class="text-sm text-gray-600 mb-2">当前进度：</p>
                    <ul class="text-sm space-y-1 text-gray-600">
                        <li>• 已掌握: <span id="modalMasteredCount">${this.masteredCards.length}</span> 个</li>
                        <li>• 未掌握: <span id="modalNotMasteredCount">${this.notMasteredCards.length}</span> 个</li>
                        <li>• 剩余: <span id="modalRemainingCount">${this.cards.length - this.currentCardIndex}</span> 个</li>
                    </ul>
                </div>
                
                <div class="mb-6">
                    <p class="text-sm text-gray-600 mb-3">请选择后续操作：</p>
                    <div class="flex gap-3 justify-center">
                        <button id="restartAllBtn" class="btn-primary text-white px-5 py-2 rounded-lg font-medium text-sm">
                            <span class="mr-1">🔄</span>
                            重新全部学习
                        </button>
                        <button id="studyNotMasteredBtn" class="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors" style="display: none;">
                            <span class="mr-1">🎯</span>
                            只学未掌握
                        </button>
                    </div>
                </div>
                
                <div class="flex gap-3 justify-center">
                    <button id="cancelEndStudyBtn" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        取消，继续学习
                    </button>
                    <button id="backToInputBtn" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors">
                        返回主页
                    </button>
                </div>
            </div>
        `;
        
        this.endStudyModal.appendChild(modalContent);
        document.body.appendChild(this.endStudyModal);
        
        // 绑定事件
        document.getElementById('restartAllBtn').addEventListener('click', () => {
            this.closeEndStudyModal();
            this.restartCurrentStudy();
        });
        
        document.getElementById('studyNotMasteredBtn').addEventListener('click', () => {
            this.closeEndStudyModal();
            this.startNextRound('notMastered');
        });
        
        document.getElementById('cancelEndStudyBtn').addEventListener('click', () => {
            this.closeEndStudyModal();
        });
        
        document.getElementById('backToInputBtn').addEventListener('click', () => {
            this.closeEndStudyModal();
            this.backToInput();
        });
        
        this.endStudyModal.addEventListener('click', (e) => {
            if (e.target === this.endStudyModal) {
                this.closeEndStudyModal();
            }
        });
    }

    // 关闭结束学习模态框
    closeEndStudyModal() {
        if (!this.endStudyModal) return;
        
        anime({
            targets: '.end-study-content',
            scale: [1, 0.8],
            opacity: [1, 0],
            duration: 300,
            easing: 'easeInQuart',
            complete: () => {
                this.endStudyModal.style.display = 'none';
            }
        });
    }

    // 重新学习全部内容
    restartCurrentStudy() {
        // 重置所有卡片状态
        this.cards.forEach(card => card.status = 'new');
        this.masteredCards = [];
        this.notMasteredCards = [];
        this.currentRound = 1;
        this.currentCardIndex = 0;
        this.lastProcessedCard = null;
        
        // 如果设置了打乱选项，重新打乱
        if (this.shuffleOption && this.shuffleOption.checked) {
            this.shuffleCards();
        }
        
        this.updateProgress();
        this.displayCurrentCard();
        
        this.showNotification('已重新开始学习全部内容', 'success');
    }

    // 返回主页（输入界面）
    backToInput() {
        // 清除当前学习数据但保留输入框内容
        this.cards = [];
        this.currentCardIndex = 0;
        this.currentRound = 1;
        this.masteredCards = [];
        this.notMasteredCards = [];
        this.isFlipped = false;
        this.lastProcessedCard = null;

        this.completionSection.style.display = 'none';
        this.studySection.style.display = 'none';
        this.inputSection.style.display = 'block';
        this.shuffleBtn.style.display = 'none';
        this.utilityButtons.style.display = 'none';

        // 不清空输入框，让用户可以选择重新生成或修改
        this.updateCardCount();

        this.showNotification('已返回主页', 'info');
    }

    // 显示错题本模态框
    showMistakeBookModal() {
        const mistakes = this.getMistakes();

        if (!this.mistakeBookModal) {
            this.createMistakeBookModal();
        }

        const modal = this.mistakeBookModal.querySelector('.mistake-book-content');
        const listEl = modal.querySelector('#mistakeList');
        const countEl = modal.querySelector('#mistakeBookCount');

        countEl.textContent = mistakes.length;

        if (mistakes.length === 0) {
            listEl.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <div class="text-4xl mb-3">🎉</div>
                    <p>太棒了！目前还没有错题记录</p>
                    <p class="text-sm mt-2">在学习过程中标记"未掌握"的卡片会出现在这里</p>
                </div>
            `;
        } else {
            // 按错误次数降序排列
            const sorted = [...mistakes].sort((a, b) => (b.count || 1) - (a.count || 1));
            listEl.innerHTML = sorted.map((m, i) => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                    <div class="flex-1">
                        <div class="font-medium text-gray-800">${this.escapeHtml(m.english)}</div>
                        <div class="text-sm text-gray-600">${this.escapeHtml(m.chinese)}</div>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                            错 ${m.count || 1} 次
                        </span>
                        <button class="remove-mistake-btn text-gray-400 hover:text-red-500 transition-colors" data-index="${i}" title="移除">
                            ✕
                        </button>
                    </div>
                </div>
            `).join('');

            // 绑定移除事件（用 currentTarget 避免点到子元素取不到 dataset）
            listEl.querySelectorAll('.remove-mistake-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(e.currentTarget.dataset.index);
                    this.removeMistake(sorted[idx]);
                    this.showMistakeBookModal(); // 刷新
                });
            });
        }

        this.mistakeBookModal.style.display = 'flex';

        anime({
            targets: '.mistake-book-content',
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 400,
            easing: 'easeOutElastic(1, .8)'
        });
    }

    // 创建错题本模态框
    createMistakeBookModal() {
        this.mistakeBookModal = document.createElement('div');
        this.mistakeBookModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        this.mistakeBookModal.style.display = 'none';

        const modalContent = document.createElement('div');
        modalContent.className = 'mistake-book-content bg-white rounded-2xl shadow-2xl max-w-lg mx-4 p-6 transform transition-all w-full';

        modalContent.innerHTML = `
            <div class="text-center mb-4">
                <div class="text-4xl mb-2">📕</div>
                <h3 class="text-2xl font-bold text-gray-800">错题本</h3>
                <p class="text-sm text-gray-600 mt-1">共 <span id="mistakeBookCount">0</span> 道错题</p>
            </div>

            <div id="mistakeList" class="max-h-80 overflow-y-auto mb-4">
                <!-- 错题列表 -->
            </div>

            <div class="flex gap-3 justify-center">
                <button id="reviewMistakesBtn" class="btn-primary text-white px-5 py-2 rounded-lg font-medium text-sm">
                    <span class="mr-1">🎯</span>
                    开始复习
                </button>
                <button id="clearMistakesBtn" class="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors">
                    <span class="mr-1">🗑️</span>
                    清空
                </button>
                <button id="closeMistakeBookBtn" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2 rounded-lg font-medium text-sm transition-colors">
                    关闭
                </button>
            </div>
        `;

        this.mistakeBookModal.appendChild(modalContent);
        document.body.appendChild(this.mistakeBookModal);

        // 绑定事件
        document.getElementById('reviewMistakesBtn').addEventListener('click', () => {
            this.closeMistakeBookModal();
            this.startMistakeReview();
        });

        document.getElementById('clearMistakesBtn').addEventListener('click', () => {
            if (confirm('确定要清空所有错题记录吗？')) {
                this.clearMistakes();
                this.showMistakeBookModal(); // 刷新
            }
        });

        document.getElementById('closeMistakeBookBtn').addEventListener('click', () => {
            this.closeMistakeBookModal();
        });

        this.mistakeBookModal.addEventListener('click', (e) => {
            if (e.target === this.mistakeBookModal) {
                this.closeMistakeBookModal();
            }
        });
    }

    // 关闭错题本模态框
    closeMistakeBookModal() {
        if (!this.mistakeBookModal) return;

        anime({
            targets: '.mistake-book-content',
            scale: [1, 0.8],
            opacity: [1, 0],
            duration: 300,
            easing: 'easeInQuart',
            complete: () => {
                this.mistakeBookModal.style.display = 'none';
            }
        });
    }

    // 开始复习错题
    startMistakeReview() {
        const mistakes = this.getMistakes();
        if (mistakes.length === 0) {
            this.showNotification('错题本为空，没有可复习的内容', 'warning');
            return;
        }

        // 构建卡片数据
        this.cards = mistakes.map((m, index) => ({
            id: `mistake_${index}`,
            english: m.english,
            chinese: m.chinese,
            status: 'new'
        }));

        // 切换到学习界面
        this.inputSection.style.display = 'none';
        this.studySection.style.display = 'block';
        this.shuffleBtn.style.display = 'inline-flex';
        this.utilityButtons.style.display = 'flex';
        this.completionSection.style.display = 'none';

        // 初始化学习状态
        this.currentCardIndex = 0;
        this.currentRound = 1;
        this.masteredCards = [];
        this.notMasteredCards = [];
        this.totalAttempts = 0;
        this.isFlipped = false;
        this.lastProcessedCard = null;

        this.updateProgress();
        this.displayCurrentCard();
        this.showNotification(`开始复习 ${mistakes.length} 道错题！`, 'success');
    }

    // 移除单条错题
    removeMistake(mistake) {
        try {
            let mistakes = this.getMistakes();
            mistakes = mistakes.filter(m => !(m.english === mistake.english && m.chinese === mistake.chinese));
            localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(mistakes));
            this.showNotification('已移除该错题', 'success');
        } catch (e) {
            console.error('移除错题失败:', e);
        }
    }

    // ==================== 斩词本模态框 ====================

    showBanishBookModal() {
        const banished = this.getBanishedCards();

        if (!this.banishBookModal) {
            this.createBanishBookModal();
        }

        const modal = this.banishBookModal.querySelector('.banish-book-content');
        const listEl = modal.querySelector('#banishList');
        const countEl = modal.querySelector('#banishBookCount');

        countEl.textContent = banished.length;

        if (banished.length === 0) {
            listEl.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <div class="text-4xl mb-3">⚔️</div>
                    <p>斩词本为空</p>
                    <p class="text-sm mt-2">在学习过程中点击"斩词"可将完全掌握的卡片加入此处</p>
                </div>
            `;
        } else {
            listEl.innerHTML = banished.map((b, i) => `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                    <div class="flex-1">
                        <div class="font-medium text-gray-800">${this.escapeHtml(b.english)}</div>
                        <div class="text-sm text-gray-600">${this.escapeHtml(b.chinese)}</div>
                    </div>
                    <button class="remove-banish-btn text-gray-400 hover:text-red-500 transition-colors" data-index="${i}" title="取消斩词">
                        ✕
                    </button>
                </div>
            `).join('');

            listEl.querySelectorAll('.remove-banish-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(e.currentTarget.dataset.index);
                    this.unbanishCard(banished[idx]);
                    this.showBanishBookModal();
                });
            });
        }

        this.banishBookModal.style.display = 'flex';

        anime({
            targets: '.banish-book-content',
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 400,
            easing: 'easeOutElastic(1, .8)'
        });
    }

    createBanishBookModal() {
        this.banishBookModal = document.createElement('div');
        this.banishBookModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        this.banishBookModal.style.display = 'none';

        const modalContent = document.createElement('div');
        modalContent.className = 'banish-book-content bg-white rounded-2xl shadow-2xl max-w-lg mx-4 p-6 transform transition-all w-full';

        modalContent.innerHTML = `
            <div class="text-center mb-4">
                <div class="text-4xl mb-2">⚔️</div>
                <h3 class="text-2xl font-bold text-gray-800">斩词本</h3>
                <p class="text-sm text-gray-600 mt-1">共 <span id="banishBookCount">0</span> 个已斩词</p>
            </div>

            <div id="banishList" class="max-h-80 overflow-y-auto mb-4">
                <!-- 斩词列表 -->
            </div>

            <div class="flex gap-3 justify-center">
                <button id="clearBanishedBtn" class="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors">
                    <span class="mr-1">🗑️</span>
                    清空
                </button>
                <button id="closeBanishBookBtn" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2 rounded-lg font-medium text-sm transition-colors">
                    关闭
                </button>
            </div>
        `;

        this.banishBookModal.appendChild(modalContent);
        document.body.appendChild(this.banishBookModal);

        document.getElementById('clearBanishedBtn').addEventListener('click', () => {
            if (confirm('确定要清空斩词本吗？清空的卡片将重新出现在测试中。')) {
                this.clearBanished();
                this.showBanishBookModal();
            }
        });

        document.getElementById('closeBanishBookBtn').addEventListener('click', () => {
            this.closeBanishBookModal();
        });

        this.banishBookModal.addEventListener('click', (e) => {
            if (e.target === this.banishBookModal) {
                this.closeBanishBookModal();
            }
        });
    }

    closeBanishBookModal() {
        if (!this.banishBookModal) return;

        anime({
            targets: '.banish-book-content',
            scale: [1, 0.8],
            opacity: [1, 0],
            duration: 300,
            easing: 'easeInQuart',
            complete: () => {
                this.banishBookModal.style.display = 'none';
            }
        });
    }

    // HTML转义工具
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    try {
        window.flashcardApp = new FlashcardApp();
        console.log('FlashcardApp initialized successfully');
        
        anime({
            targets: '.container > *',
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 800,
            delay: anime.stagger(100),
            easing: 'easeOutQuart'
        });
        
        anime({
            targets: '.shape',
            translateY: [-10, 10],
            duration: 3000,
            direction: 'alternate',
            loop: true,
            easing: 'easeInOutSine',
            delay: anime.stagger(200)
        });
    } catch (error) {
        console.error('Error initializing FlashcardApp:', error);
    }
});

// 工具函数
const utils = {
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
};

window.FlashcardApp = FlashcardApp;
window.utils = utils;