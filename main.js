// 双语认读卡片助手 - 主要JavaScript逻辑

class FlashcardApp {
    constructor() {
        this.cards = [];
        this.currentCardIndex = 0;
        this.currentRound = 1;
        this.masteredCards = [];
        this.notMasteredCards = [];
        this.isFlipped = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadSampleData();
    }

    initializeElements() {
        // 输入相关元素
        this.cardInput = document.getElementById('cardInput');
        this.generateBtn = document.getElementById('generateBtn');
        this.cardCount = document.getElementById('cardCount');
        this.shuffleBtn = document.getElementById('shuffleBtn');
        this.shuffleOption = document.getElementById('shuffleOption');
        

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

    loadSampleData() {
        // 加载示例数据，展示不同的分隔方式
        const sampleData = `look | 看
look at... :: 看......
it's=it is | 它是
A red balloon, please. | 请给我一个红色的气球
hello | 你好
thank you | 谢谢
good morning :: 早上好
how are you | 你好吗
what is this | 这是什么
I love you | 我爱你`;
        
        this.cardInput.value = sampleData;
        this.updateCardCount();
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

    endRound() {
        if (this.notMasteredCards.length === 0) {
            // 所有卡片都已掌握
            this.completeStudy();
        } else {
            // 开始新一轮
            this.currentRound++;
            this.roundCount.textContent = this.currentRound;
            
            // 将未掌握的卡片重新加入学习队列
            this.cards = [...this.notMasteredCards];
            this.notMasteredCards = [];
            this.currentCardIndex = 0;
            
            this.shuffleCards();
            this.displayCurrentCard();
            
            this.showNotification(`第 ${this.currentRound} 轮开始！`, 'info');
        }
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
        
        // 重新加载示例数据
        this.loadSampleData();
        
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

    showNotification(message, type = 'info') {
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
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        switch(type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            default: return 'ℹ️';
        }
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