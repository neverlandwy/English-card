// 双语认读卡片助手 - 主要JavaScript逻辑

class FlashcardApp {
    constructor() {
        this.cards = [];
        this.currentCardIndex = 0;
        this.currentRound = 1;
        this.masteredCards = [];
        this.notMasteredCards = [];
        this.isFlipped = false;
        this.aiPromptModal = null;
        this.instructionsModal = null;
        this.endRoundModal = null;
        
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
        this.restartBtn = document.getElementById('restartBtn');

        // 完成界面元素
        this.completionSection = document.getElementById('completionSection');
        this.finalCardCount = document.getElementById('finalCardCount');
        this.totalRounds = document.getElementById('totalRounds');
        this.efficiency = document.getElementById('efficiency');
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
        
        if (this.restartBtn) {
            this.restartBtn.addEventListener('click', () => this.restart());
        }

        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
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
                    const chineseCharPattern = /[\u4e00-\u9fa5，。！？；：""''（）【】《】]/;
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
        
        if (this.cards.length === 0) {
            this.showNotification('请输入有效的双语内容', 'error');
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
        
        // 初始化学习状态
        this.currentCardIndex = 0;
        this.currentRound = 1;
        this.masteredCards = [];
        this.notMasteredCards = [];
        this.isFlipped = false;

        this.updateProgress();
        this.displayCurrentCard();
        this.showNotification('开始学习！点击卡片查看中文', 'success');
    }

    // 新增：字体大小自适应调整
    adjustFontSize() {
        const englishLength = this.englishText.textContent.length;
        const chineseLength = this.chineseText.textContent.length;
        const maxLength = Math.max(englishLength, chineseLength);
        
        // 基础字体大小（对应原来的2.25rem）
        let fontSize = 2.25;
        
        // 根据字符数量动态调整
        if (maxLength > 80) {
            fontSize = 1.2; // 极小字体
        } else if (maxLength > 60) {
            fontSize = 1.5; // 小字体
        } else if (maxLength > 40) {
            fontSize = 1.8; // 中等字体
        } else if (maxLength > 25) {
            fontSize = 2.0; // 稍小字体
        }
        
        // 应用字体大小
        this.englishText.style.fontSize = fontSize + 'rem';
        this.chineseText.style.fontSize = fontSize + 'rem';
        
        // 调整行高以改善可读性
        if (fontSize < 1.5) {
            this.englishText.style.lineHeight = '1.3';
            this.chineseText.style.lineHeight = '1.3';
        } else {
            this.englishText.style.lineHeight = '1.4';
            this.chineseText.style.lineHeight = '1.4';
        }
    }

    displayCurrentCard() {
        if (this.currentCardIndex >= this.cards.length) {
            this.endRound();
            return;
        }

        const card = this.cards[this.currentCardIndex];
        
        // 完全重置卡片状态
        this.isFlipped = false;
        this.studyCard.classList.remove('flipped');
        this.controlButtons.style.display = 'none';

        // 确保卡片完全隐藏和重置
        anime.set(this.studyCard, {
            opacity: 0,
            translateX: 0,
            scale: 1,
            rotateY: 0
        });

        // 更新卡片内容
        this.englishText.textContent = card.english;
        this.chineseText.textContent = card.chinese;

        // 调整字体大小
        this.adjustFontSize();

        // 设置卡片进入动画
        anime({
            targets: this.studyCard,
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuart'
        });
    }

    flipCard() {
        console.log('Flip card called, isFlipped:', this.isFlipped);
        if (this.isFlipped) return;

        this.isFlipped = true;
        this.studyCard.classList.add('flipped');
        console.log('Card flipped class added');
        
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

        // 添加翻转音效（可选）
        this.playSound('flip');
    }

    markMastered() {
        const card = this.cards[this.currentCardIndex];
        card.status = 'mastered';
        this.masteredCards.push(card);
        
        this.playSound('success');
        this.showNotification('很好！已标记为已掌握', 'success');
        
        // 使用改进的卡片切换方法
        this.switchToNextCard('mastered');
    }

    markNotMastered() {
        const card = this.cards[this.currentCardIndex];
        card.status = 'not_mastered';
        this.notMasteredCards.push(card);
        
        this.playSound('warning');
        this.showNotification('没关系，下一轮继续练习', 'info');
        
        // 使用改进的卡片切换方法
        this.switchToNextCard('not_mastered');
    }

    nextCardNotMastered() {
        this.switchToNextCard('not_mastered');
    }

    switchToNextCard(type) {
        this.currentCardIndex++;
        
        // 隐藏控制按钮
        this.controlButtons.style.display = 'none';
        
        // 确保卡片回到正面状态，避免翻转状态造成显示问题
        this.studyCard.classList.remove('flipped');
        this.isFlipped = false;
        
        // 直接淡出当前卡片，不使用翻转动画
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

    nextCard() {
        this.switchToNextCard('mastered');
    }

    // 修改：轮次结束时的处理逻辑
    endRound() {
        // 显示轮次总结弹窗
        this.showEndRoundModal();
    }

    // 新增：显示轮次结束弹窗
    showEndRoundModal() {
        // 创建弹窗（如果不存在）
        if (!this.endRoundModal) {
            this.createEndRoundModal();
        }

        // 更新统计数据
        const totalInRound = this.masteredCards.length + this.notMasteredCards.length;
        
        // 修复：计算掌握率
        const accuracy = totalInRound > 0 ? Math.round((this.masteredCards.length / totalInRound) * 100) : 0;
        
        // 修复：更新弹窗中的数据
        const modal = this.endRoundModal.querySelector('.modal-content');
        modal.querySelector('#roundNumber').textContent = this.currentRound; // 更新轮次数
        modal.querySelector('#roundTotalCards').textContent = totalInRound;
        modal.querySelector('#roundMasteredCount').textContent = this.masteredCards.length;
        modal.querySelector('#roundNotMasteredCount').textContent = this.notMasteredCards.length;
        modal.querySelector('#roundAccuracy').textContent = accuracy + '%'; // 修复：正确更新掌握率

        // 修改：根据未掌握卡片数量决定是否显示"只测未掌握内容"按钮
        const testNotMasteredBtn = modal.querySelector('#testNotMasteredBtn');
        if (this.notMasteredCards.length === 0) {
            testNotMasteredBtn.style.display = 'none';
        } else {
            testNotMasteredBtn.style.display = 'inline-flex';
        }

        // 显示弹窗
        this.endRoundModal.style.display = 'flex';
        
        // 添加显示动画
        anime({
            targets: '.modal-content',
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 400,
            easing: 'easeOutElastic(1, .8)'
        });
    }

    // 新增：创建轮次结束弹窗
    createEndRoundModal() {
        // 创建模态框容器
        this.endRoundModal = document.createElement('div');
        this.endRoundModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        this.endRoundModal.style.display = 'none';
        
        // 创建模态框内容
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
                
                <!-- 修改：按钮文字和功能已更新 -->
                <button id="clearAndRestartBtn" class="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors mt-3">
                    清空当前卡片，学习新内容
                </button>
            </div>
        `;
        
        this.endRoundModal.appendChild(modalContent);
        document.body.appendChild(this.endRoundModal);
        
        // 绑定事件
        document.getElementById('testAllBtn').addEventListener('click', () => this.startNextRound('all'));
        document.getElementById('testNotMasteredBtn').addEventListener('click', () => this.startNextRound('notMastered'));
        
        // 修改：绑定新按钮的点击事件，先关闭弹窗再重置
        document.getElementById('clearAndRestartBtn').addEventListener('click', () => {
            this.closeEndRoundModal();
            this.restart();
        });
        
        // 点击背景关闭
        this.endRoundModal.addEventListener('click', (e) => {
            if (e.target === this.endRoundModal) {
                this.closeEndRoundModal();
            }
        });
    }

    // 新增：关闭轮次结束弹窗
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

    // 新增：开始下一轮学习
    startNextRound(mode) {
        this.closeEndRoundModal();
        
        if (mode === 'all') {
            // 重新测试所有卡片
            this.cards = [...this.masteredCards, ...this.notMasteredCards];
            // 重置所有卡片状态
            this.cards.forEach(card => {
                if (card.status === 'mastered') {
                    card.status = 'new';
                }
            });
            this.masteredCards = [];
            this.notMasteredCards = [];
        } else if (mode === 'notMastered') {
            // 只测试未掌握的卡片
            this.cards = [...this.notMasteredCards];
            this.notMasteredCards = [];
            this.masteredCards = [];
        }

        // 增加轮次计数
        this.currentRound++;
        this.roundCount.textContent = this.currentRound;

        // 打乱卡片顺序
        this.shuffleCards();

        // 重置索引并继续
        this.currentCardIndex = 0;
        this.displayCurrentCard();
        
        this.showNotification(`第 ${this.currentRound} 轮开始！`, 'info');
    }

    completeStudy() {
        this.studySection.style.display = 'none';
        this.completionSection.style.display = 'block';
        
        // 更新完成统计
        this.finalCardCount.textContent = this.masteredCards.length;
        this.totalRounds.textContent = this.currentRound;
        
        // 计算掌握效率
        const totalAttempts = this.masteredCards.length + 
                             (this.currentRound - 1) * this.masteredCards.length;
        const efficiency = Math.round((this.masteredCards.length / totalAttempts) * 100);
        this.efficiency.textContent = efficiency + '%';
        
        // 添加庆祝动画
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
        
        // Fisher-Yates 洗牌算法
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
        
        // 只有在学习阶段才显示通知
        if (this.studySection.style.display !== 'none') {
            this.showNotification('卡片已重新排序', 'info');
        }
    }

    restart() {
        // 重置所有状态
        this.cards = [];
        this.currentCardIndex = 0;
        this.currentRound = 1;
        this.masteredCards = [];
        this.notMasteredCards = [];
        this.isFlipped = false;
        
        // 重置界面
        this.completionSection.style.display = 'none';
        this.studySection.style.display = 'none';
        this.inputSection.style.display = 'block';
        this.shuffleBtn.style.display = 'none';
        
        // 清空输入
        this.cardInput.value = '';
        this.updateCardCount();
        
        this.showNotification('已重置，可以开始新的学习', 'info');
    }

    handleKeyboard(e) {
        if (this.studySection.style.display === 'none') return;
        
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
                }
                break;
        }
    }

    playSound(type) {
        // 简单的音效模拟（实际项目中可以使用真实音频文件）
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        switch(type) {
            case 'success':
                this.playTone(audioContext, 800, 0.1, 200);
                break;
            case 'flip':
                this.playTone(audioContext, 400, 0.05, 100);
                break;
            case 'warning':
                this.playTone(audioContext, 300, 0.1, 300);
                break;
            case 'celebration':
                this.playTone(audioContext, 600, 0.2, 500);
                setTimeout(() => this.playTone(audioContext, 800, 0.2, 500), 200);
                break;
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
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
        
        // 根据类型设置样式
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
        
        // 显示动画
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // 自动隐藏
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

    // ==================== AI提示词功能 ====================
    
    copyAIPrompt() {
        // 修改1：更新提示词内容
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

        // 创建临时文本区域用于复制
        const tempTextarea = document.createElement('textarea');
        tempTextarea.value = promptText;
        tempTextarea.style.position = 'fixed';
        tempTextarea.style.opacity = '0';
        document.body.appendChild(tempTextarea);
        tempTextarea.select();
        
        try {
            // 执行复制操作
            const successful = document.execCommand('copy');
            document.body.removeChild(tempTextarea);
            
            if (successful) {
                this.showCopySuccessModal();
            } else {
                this.showNotification('复制失败，请手动复制', 'error');
            }
        } catch (err) {
            console.error('复制失败:', err);
            document.body.removeChild(tempTextarea);
            this.showNotification('复制失败，请手动复制', 'error');
        }
    }

    showCopySuccessModal() {
        // 创建弹窗（如果不存在）
        if (!this.aiPromptModal) {
            this.createPromptModal();
        }
        
        // 显示弹窗
        this.aiPromptModal.style.display = 'flex';
        
        // 添加显示动画
        anime({
            targets: '.modal-content',
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 400,
            easing: 'easeOutElastic(1, .8)'
        });
    }

    createPromptModal() {
        // 创建模态框容器
        this.aiPromptModal = document.createElement('div');
        this.aiPromptModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        this.aiPromptModal.style.display = 'none';
        
        // 创建模态框内容
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
        
        // 绑定关闭事件
        const closeBtn = document.getElementById('closeModalBtn');
        const viewExampleBtn = document.getElementById('viewExampleBtn');
        
        // 点击关闭按钮
        closeBtn.addEventListener('click', () => this.closeModal());
        
        // 点击查看示例
        viewExampleBtn.addEventListener('click', () => {
            this.showExample();
            this.closeModal();
        });
        
        // 点击背景关闭
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

        // 填充示例
        this.cardInput.value = exampleText;
        this.updateCardCount();
        
        // 显示提示
        this.showNotification('示例已加载！请删除示例内容后粘贴您的AI结果', 'success');
    }

    // ==================== 使用说明功能 ====================

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
                        <li>在输入框中填写英文-中文对照内容（每行一对）</li>
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
                        <span class="text-red-500 mr-2">💡</span>
                        学习建议
                    </h4>
                    <ul class="text-sm space-y-1 ml-5 list-disc">
                        <li>对于难记的词汇，可多次标记"未掌握"进行重复练习</li>
                        <li>善用"随机排序"功能，避免顺序记忆</li>
                        <li>可导入课本、PDF、截图等多种学习材料</li>
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
        
        // 绑定事件
        document.getElementById('closeInstructionsBtn').addEventListener('click', () => this.closeInstructionsModal());
        document.getElementById('loadExampleBtn').addEventListener('click', () => {
            this.loadSampleData();
            this.closeInstructionsModal();
        });
        
        // 点击背景关闭
        this.instructionsModal.addEventListener('click', (e) => {
            if (e.target === this.instructionsModal) {
                this.closeInstructionsModal();
            }
        });
    }

    // 新增：加载示例数据方法
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
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    try {
        window.flashcardApp = new FlashcardApp();
        console.log('FlashcardApp initialized successfully');
        
        // 添加页面加载动画
        anime({
            targets: '.container > *',
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 800,
            delay: anime.stagger(100),
            easing: 'easeOutQuart'
        });
        
        // 添加浮动元素的动画
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

// 添加一些实用的工具函数
const utils = {
    // 防抖函数
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

    // 节流函数
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

    // 格式化时间
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    // 生成随机ID
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }
};

// 导出到全局作用域（如果需要）
window.FlashcardApp = FlashcardApp;
window.utils = utils;