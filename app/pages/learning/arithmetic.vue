<template>
  <view class="container tool-page">
    <view class="page-content">
      <view class="tool-header"><image src="/static/ui/numbers.png" mode="aspectFit" /><view><text class="tool-title">口算练习</text><text class="tool-copy">选好题型，按自己的节奏练一练。</text></view></view>
      <view class="section">
        <view class="section-title">选择题型（可多选）</view>
        <view class="option-group">
          <view v-for="(type, index) in operationTypes" :key="index"
            :class="['option-item', selectedTypes.includes(type.value) ? 'active' : '']"
            @click="toggleOperationType(type.value)">{{ type.label }}</view>
        </view>
      </view>

      <view class="section">
        <view class="section-title">选择难度</view>
        <view class="option-group">
          <view v-for="(level, index) in difficultyLevels" :key="index"
            :class="['option-item', difficulty === level.value ? 'active' : '']"
            @click="difficulty = level.value">{{ level.label }}</view>
        </view>
        <view class="checkbox-group">
          <label class="checkbox-item">
             <checkbox-group @change="handleMultipleStepsChange">
              <label class="checkbox-item">
                <checkbox value="multipleSteps" :checked="hasMultipleSteps" />多步骤运算
              </label>
            </checkbox-group>
          </label>
          <label class="checkbox-item">
            <checkbox-group @change="handleBracketsChange">
              <label class="checkbox-item">
                <checkbox value="hasBrackets" :checked="hasBrackets" />括号运算
              </label>
            </checkbox-group>
          </label>
        </view>
      </view>

      <view class="section">
        <view class="section-title">选择题量</view>
        <view class="option-group">
          <view v-for="count in questionCounts" :key="count"
            :class="['option-item', numQuestions === count ? 'active' : '']"
            @click="numQuestions = count">{{ count }}题</view>
        </view>
      </view>

      <button class="generate-btn" @click="generateQuestions">{{ questions.length > 0 ? '重新生成' : '生成题目' }}</button>

      <view v-if="questions.length > 0" class="export-section">
        <button class="export-btn" @click="exportQuestions">导出题目</button>
      </view>

      <view v-if="questions.length > 0" class="questions-section">
        <view class="question-list">
          <view v-for="(q, index) in questions" :key="index" class="question-item">
            <text class="question-text">{{ q.text }} = </text>
            <input type="number" v-model="q.userAnswer" class="answer-input" @blur="checkAnswer(index)" />
            <view v-if="q.isAnswered" :class="['result-icon', q.isCorrect ? 'correct' : 'wrong']">
              {{ q.isCorrect ? '✓' : '✗' }}
            </view>
          </view>
        </view>
        <view class="score-section" v-if="showScore">
          <view class="score-text">得分：{{ score }}分</view>
          <view class="flowers-container">
            <image v-for="n in earnedFlowers" :key="n" src="/static/icons/flower.png" class="flower-icon" />
          </view>
        </view>
      </view>



      <!-- 临时canvas用于导出 -->
      <canvas canvas-id="tempCanvas" style="position: fixed; left: -9999px; width: 595px; height: 842px;" />

    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      numQuestions: 10,
      difficulty: 'easy',
      selectedTypes: ['add'],
      questions: [],
      score: 0,
      earnedFlowers: 0,
      showScore: false,
      hasMultipleSteps: false,
      hasBrackets: false,
      operationTypes: [
        { label: '加法', value: 'add' },
        { label: '减法', value: 'subtract' },
        { label: '乘法', value: 'multiply' },
        { label: '除法', value: 'divide' }
      ],
      showExportPreview: false,
      difficultyLevels: [
        { label: '一位数', value: 'easy' },
        { label: '两位数', value: 'medium' },
        { label: '多位数', value: 'hard' }
      ],
      questionCounts: [10, 20, 50, 100]
    }
  },
  methods: {
    generateQuestions() {
      console.log('开始生成题目，配置:', {
        difficulty: this.difficulty,
        selectedTypes: this.selectedTypes,
        hasMultipleSteps: this.hasMultipleSteps,
        hasBrackets: this.hasBrackets
      });

      this.questions = [];
      this.showScore = false;
      this.score = 0;
      this.earnedFlowers = 0;

      const operations = this.getSelectedOperations();
      console.log('选中的运算符:', operations);

      try {
        const generatedExpressions = new Set(); // 用于存储已生成的表达式

        for (let i = 0; i < this.numQuestions; i++) {
          let expression, correctAnswer;
          let attempts = 0;
          const maxAttempts = 50; // 最大尝试次数

          // 尝试生成不重复的题目
          do {
            if (this.hasMultipleSteps) {
              console.log(`尝试生成第${i + 1}个多步骤题目，第${attempts + 1}次尝试`);
              const steps = Math.floor(Math.random() * 2) + 2;
              [expression, correctAnswer] = this.generateMultiStepQuestion(steps, operations);
            } else {
              console.log(`尝试生成第${i + 1}个单步骤题目，第${attempts + 1}次尝试`);
              [expression, correctAnswer] = this.generateSingleStepQuestion(operations);
            }
            attempts++;

            // 如果尝试次数过多，调整表达式使其不重复
            if (attempts >= maxAttempts && generatedExpressions.has(expression)) {
              expression = `(${expression})`; // 添加括号使表达式不同
            }
          } while (generatedExpressions.has(expression) && attempts < maxAttempts + 1);

          console.log('生成的题目:', expression, '答案:', correctAnswer, '尝试次数:', attempts);
          generatedExpressions.add(expression);

          this.questions.push({
            text: expression,
            correctAnswer,
            userAnswer: '',
            isAnswered: false,
            isCorrect: false
          });
        }
        console.log('题目生成完成，总数:', this.questions.length);
      } catch (error) {
        console.error('生成题目时发生错误:', error);
        uni.showToast({
          title: '生成题目失败，请重试',
          icon: 'none'
        });
      }
    },

    generateSingleStepQuestion(operations) {
      const operation = operations[Math.floor(Math.random() * operations.length)];
      let [num1, num2] = this.generateNumbers();

        if (operation === '÷') {
          // 确保除数不为零且被除数大于除数
          while (num2 === 0 || num2 === 1 || num1 === num2 || (num1 % num2 !== 0)) {
            [num1, num2] = this.generateNumbers();
          }
          return [`${num1} ${operation} ${num2}`, this.calculateAnswer(num1, num2, operation)];
        }

      const expression = `${num1} ${operation} ${num2}`;
      return [expression, this.calculateAnswer(num1, num2, operation)];
    },

    calculateExpression(expression) {
      try {
        const precedence = {
          '+': 1,
          '-': 1,
          '×': 2,
          '÷': 2
        };

        const numbers = [];
        const operators = [];

        const calculate = () => {
          const b = numbers.pop();
          const a = numbers.pop();
          const op = operators.pop();

          let result;
          switch(op) {
            case '+':
              result = a + b;
              break;
            case '-':
              result = a - b;
              break;
            case '×':
              result = a * b;
              break;
            case '÷':
              if (b === 0) throw new Error('除数不能为0');
              result = a / b;
              break;
          }

          // 验证结果是否合理
          if (!isFinite(result) || result > 1000000) {
            throw new Error('计算结果过大或无效');
          }

          numbers.push(result);
        };

        const tokens = expression.match(/\d+|[+\-×÷()]|\s+/g).filter(t => t.trim());

        for (let token of tokens) {
          if (/\d+/.test(token)) {
            numbers.push(Number(token));
          } else if (token === '(') {
            operators.push(token);
          } else if (token === ')') {
            while (operators.length && operators[operators.length - 1] !== '(') {
              calculate();
            }
            operators.pop(); // 移除左括号
          } else {
            while (operators.length && operators[operators.length - 1] !== '(' &&
                  precedence[operators[operators.length - 1]] >= precedence[token]) {
              calculate();
            }
            operators.push(token);
          }
        }

        while (operators.length) {
          calculate();
        }

        const result = numbers[0];
        console.log('表达式计算结果:', result);
        return result;
      } catch (error) {
        console.error('计算表达式错误:', error);
        throw error;
      }
    },

    generateMultiStepQuestion(steps, operations) {
      let attempts = 0;
      const maxAttempts = 100;

      console.log('开始生成多步骤题目:', {
        steps,
        operations,
        difficulty: this.difficulty
      });

      while (attempts < maxAttempts) {
        try {
          let numbers = [];
          let operationsUsed = [];

          // 生成数字
          for (let i = 0; i < steps + 1; i++) {
            const [num] = this.generateNumbers();
            if (operations.includes('×') && this.difficulty !== 'easy') {
              numbers.push(Math.min(num, 30));
            } else {
              numbers.push(num);
            }
          }
          console.log('生成的数字:', numbers);

          // 生成运算符
          for (let i = 0; i < steps; i++) {
            let operation;
            let attempts = 0;
            const maxAttempts = 10;

            // 检查是否只选择了乘除法
            const hasOnlyMultiplyDivide = operations.every(op => op === '×' || op === '÷');

            do {
              attempts++;
              operation = operations[Math.floor(Math.random() * operations.length)];

              // 如果尝试次数过多或只有乘除法可选，则强制跳出
              if (attempts >= maxAttempts || hasOnlyMultiplyDivide) {
                break;
              }
            } while (
              i > 0 &&
              (operation === '×' || operation === '÷') &&
              (operationsUsed[i-1] === '×' || operationsUsed[i-1] === '÷')
            );

            console.log(`第${i + 1}个运算符生成:`, operation, '尝试次数:', attempts);
            operationsUsed.push(operation);
          }
          console.log('生成的运算符:', operationsUsed);

          // 处理除法
          for (let i = 0; i < operationsUsed.length; i++) {
            if (operationsUsed[i] === '÷') {
              console.log('处理除法运算:', i, numbers[i], numbers[i + 1]);
              let divisor = numbers[i + 1];
              let dividend = numbers[i];

              if (divisor === 0 || divisor === 1 || dividend < divisor || dividend % divisor !== 0) {
                if (this.difficulty === 'easy') {
                  divisor = Math.max(2, Math.min(9, divisor));
                  dividend = divisor * Math.floor(Math.random() * 5 + 2);
                } else if (this.difficulty === 'medium') {
                  divisor = Math.max(2, Math.min(20, divisor));
                  dividend = divisor * Math.floor(Math.random() * 8 + 2);
                } else {
                  divisor = Math.max(2, Math.min(30, divisor));
                  dividend = divisor * Math.floor(Math.random() * 10 + 2);
                }
                numbers[i] = dividend;
                numbers[i + 1] = divisor;
                console.log('调整后的除法数字:', dividend, divisor);
              }
            }
          }

          // 构建表达式
          const expression = this.hasBrackets && steps >= 2
            ? this.constructExpressionWithBrackets(numbers, operationsUsed, Math.floor(Math.random() * (steps - 1)))
            : numbers.reduce((acc, curr, idx) =>
                idx === 0 ? curr : `${acc} ${operationsUsed[idx-1]} ${curr}`, '');

          console.log('构建的表达式:', expression);

          const result = this.calculateExpression(expression);
          console.log('计算结果:', result);

          if (isFinite(result) && result > 0 && result <= 1000 && Number.isInteger(result)) {
            console.log('生成成功，尝试次数:', attempts + 1);
            return [expression, result];
          }
        } catch (error) {
          console.error('生成题目尝试失败:', error, '尝试次数:', attempts + 1);
        }

        attempts++;
      }

      console.warn('多步骤生成失败，转为生成单步骤题目');
      return this.generateSingleStepQuestion(operations);
    },


    generateNumbers() {
      let range, min;
      switch (this.difficulty) {
        case 'easy':
          range = 9;
          min = 1;
          break;
        case 'medium':
          range = 90;
          min = 10;
          break;
        case 'hard':
          range = 900;
          min = 100;
          break;
      }
      const num1 = Math.floor(Math.random() * (range - min + 1)) + min;
      const num2 = Math.floor(Math.random() * (range - min + 1)) + min;
      return [num1, num2];
    },

    constructExpressionWithBrackets(numbers, operations, bracketStart) {
      let expression = '';
      for (let i = 0; i < numbers.length; i++) {
        if (i === bracketStart) expression += '(';
        expression += numbers[i];
        if (i === bracketStart + 1) expression += ')';
        if (i < operations.length) expression += ` ${operations[i]} `;
      }
      return expression;
    },

    getSelectedOperations() {
      const operationMap = {
        add: '+',
        subtract: '-',
        multiply: '×',
        divide: '÷'
      };
      return this.selectedTypes.map(type => operationMap[type]);
    },

    getOperationByType(type) {
      const operationMap = {
        add: ['+'],
        subtract: ['-'],
        multiply: ['*'],
        divide: ['/']
      };
      return operationMap[type] || ['+', '-', '*', '/'];
    },

    calculateAnswer(num1, num2, operation) {
      switch (operation) {
        case '+':
          return num1 + num2;
        case '-':
          return num1 - num2;
        case '×':
        case '*':
          return num1 * num2;
        case '÷':
        case '/':
          return num1 / num2;
        default:
          return 0;
      }
    },

    checkAnswer(index) {
      const question = this.questions[index];
      if (!question.userAnswer) return;

      // 如果之前答对了，不需要重新检查
      if (question.isAnswered && question.isCorrect) return;

      const userAnswer = parseFloat(question.userAnswer);
      question.isAnswered = true;
      question.isCorrect = Math.abs(userAnswer - question.correctAnswer) < 0.01;

      const allAnswered = this.questions.every(q => q.isAnswered);
      if (allAnswered) {
        // 计算总分
        const correctCount = this.questions.filter(q => q.isCorrect).length;
        this.score = Math.floor((correctCount / this.questions.length) * 100);
        console.log('所有题目已答完，正确数:', correctCount, '总分:', this.score);

        this.showScore = true;
        this.calculateFlowers();
      }
    },

    calculateFlowers() {
      const scorePercentage = this.score / 100;
      if (scorePercentage >= 0.9) this.earnedFlowers = 3;
      else if (scorePercentage >= 0.7) this.earnedFlowers = 2;
      else if (scorePercentage >= 0.5) this.earnedFlowers = 1;
    },

    toggleOperationType(value) {
      const index = this.selectedTypes.indexOf(value);
      if (index === -1) {
        this.selectedTypes.push(value);
      } else {
        this.selectedTypes.splice(index, 1);
      }
      // 确保至少选择一个运算类型
      if (this.selectedTypes.length === 0) {
        this.selectedTypes.push(value);
      }
    },

    handleMultipleStepsChange(e) {
      this.hasMultipleSteps = e.detail.value.length > 0;
      if (this.hasBrackets && !this.hasMultipleSteps) {
        this.hasBrackets = false;
      }
    },

    handleBracketsChange(e) {
      this.hasBrackets = e.detail.value.length > 0;
      if (this.hasBrackets && !this.hasMultipleSteps) {
        this.hasMultipleSteps = true;
      }
    },

    async exportQuestions() {
      try {
        uni.showLoading({
          title: '正在导出...',
          mask: true
        });

        const systemInfo = uni.getSystemInfoSync();
        const dpr = systemInfo.pixelRatio || 2;

        // 创建两个画布上下文，分别用于题目和答案
        const ctxQuestions = uni.createCanvasContext('tempCanvas', this);

        const a4Width = 595;
        const a4Height = 842;
        const margin = 50;
        const contentWidth = a4Width - (margin * 2);

        // 根据题目数量动态调整字体大小和每行题目数
        let fontSize = this.numQuestions > 50 ? 14 : 16;
        let questionsPerRow = this.numQuestions > 50 ? 3 : 2;
        let lineHeight = this.numQuestions > 50 ? 35 : 45;

        // 绘制题目页
        ctxQuestions.setFillStyle('#FFFFFF');
        ctxQuestions.fillRect(0, 0, a4Width, a4Height);

        // 绘制标题
        ctxQuestions.setFontSize(28);
        ctxQuestions.setTextAlign('center');
        ctxQuestions.setFillStyle('#333333');
        ctxQuestions.fillText('口算练习题', a4Width / 2, margin + 10);

        // 绘制题目
        const questionWidth = contentWidth / questionsPerRow;
        const titleHeight = 50;

        ctxQuestions.setFontSize(fontSize);
        ctxQuestions.setTextAlign('left');
        this.questions.forEach((q, index) => {
          const row = Math.floor(index / questionsPerRow);
          const col = index % questionsPerRow;
          const x = margin + (col * questionWidth);
          const y = margin + titleHeight + (row * lineHeight);
          ctxQuestions.fillText(`${q.text} = ____`, x, y);
        });

        // 执行题目页绘制
        await new Promise((resolve) => {
          ctxQuestions.draw(false, () => {
            setTimeout(resolve, 300);
          });
        });

        // 导出题目页
        const questionsImage = await new Promise((resolve, reject) => {
          uni.canvasToTempFilePath({
            canvasId: 'tempCanvas',
            width: a4Width,
            height: a4Height,
            destWidth: a4Width * dpr,
            destHeight: a4Height * dpr,
            fileType: 'jpg',
            quality: 1.0,
            success: (res) => resolve(res.tempFilePath),
            fail: reject
          });
        });

        // 保存题目页到相册
        await uni.saveImageToPhotosAlbum({
          filePath: questionsImage
        });

        // 创建答案页画布
        const ctxAnswers = uni.createCanvasContext('tempCanvas', this);

        // 绘制答案页
        ctxAnswers.setFillStyle('#FFFFFF');
        ctxAnswers.fillRect(0, 0, a4Width, a4Height);

        // 绘制答案页标题
        ctxAnswers.setFontSize(28);
        ctxAnswers.setTextAlign('center');
        ctxAnswers.setFillStyle('#333333');
        ctxAnswers.fillText('答案', a4Width / 2, margin + 10);

        // 绘制答案
        ctxAnswers.setFontSize(fontSize);
        ctxAnswers.setTextAlign('left');
        this.questions.forEach((q, index) => {
          const row = Math.floor(index / questionsPerRow);
          const col = index % questionsPerRow;
          const x = margin + (col * questionWidth);
          const y = margin + titleHeight + (row * lineHeight);
          ctxAnswers.fillText(`${q.text} = ${q.correctAnswer}`, x, y);
        });

        // 执行答案页绘制
        await new Promise((resolve) => {
          ctxAnswers.draw(false, () => {
            setTimeout(resolve, 300);
          });
        });

        // 导出答案页
        const answersImage = await new Promise((resolve, reject) => {
          uni.canvasToTempFilePath({
            canvasId: 'tempCanvas',
            width: a4Width,
            height: a4Height,
            destWidth: a4Width * dpr,
            destHeight: a4Height * dpr,
            fileType: 'jpg',
            quality: 1.0,
            success: (res) => resolve(res.tempFilePath),
            fail: reject
          });
        });

        // 保存答案页到相册
        await uni.saveImageToPhotosAlbum({
          filePath: answersImage
        });

        uni.showToast({
          title: '导出成功',
          icon: 'success'
        });
      } catch (error) {
        console.error('导出失败:', error);
        uni.showToast({
          title: '导出失败',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    }
  }
}
</script>

<style scoped>
.container {
  background-color: #f8f8f8;
  min-height: 100vh;
}

.page-content {
  padding: 16px;
}

.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  color: #333;
  margin-bottom: 12px;
  font-weight: bold;
}

.option-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.option-item {
  padding: 8px 16px;
  background-color: #fff;
  border-radius: 20px;
  font-size: 14px;
  color: #666;
  border: 1px solid #eee;
  transition: all 0.3s;
}

.option-item.active {
  background-color: #2196f3;
  color: #fff;
  border-color: #2196f3;
}

.questions-section {
  margin-top: 24px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.question-text {
  font-size: 16px;
  color: #333;
  flex: 1;
}

.answer-input {
  width: 80px;
  height: 36px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 16px;
}

.result-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  border-radius: 50%;
}

.result-icon.correct {
  color: #4caf50;
}

.result-icon.wrong {
  color: #f44336;
}

.score-section {
  margin-top: 24px;
  text-align: center;
}

.score-text {
  font-size: 18px;
  color: #333;
  margin-bottom: 12px;
}

.flowers-container {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.flower-icon {
  width: 32px;
  height: 32px;
}

.generate-btn {
  margin-top: 24px;
  width: 100%;
  height: 44px;
  background-color: #2196f3;
  color: #fff;
  border-radius: 22px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.checkbox-group {
  margin-top: 12px;
  display: flex;
  gap: 16px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #666;
}

.export-section {
  margin-top: 16px;
}

.export-btn {
  width: 100%;
  height: 44px;
  background-color: #4caf50;
  color: #fff;
  border-radius: 22px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}

.export-preview {
  margin-top: 24px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
}

.preview-title {
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 24px;
}

.preview-questions,
.preview-answers {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.preview-question-item,
.preview-answer-item {
  font-size: 14px;
  padding: 8px;
}

.preview-page-break {
  height: 1px;
  background-color: #ddd;
  margin: 24px 0;
}

</style>
<style src="@/styles/tools.css"></style>
