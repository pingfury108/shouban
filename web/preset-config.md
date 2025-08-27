# 手办生成预设配置说明

## 如何添加新的预设按钮

在 `ImageProcessor.jsx` 文件中找到 `presetPrompts` 对象，按照以下格式添加新的预设：

```javascript
const presetPrompts = {
  "默认手办": "turn this photo into a character figure. Behind it, place a box with the character's image printed on it, and a computer showing the Blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. Make the PVC material look clear, and set the scene indoors if possible",
  
  // 添加新预设的示例：
  "可爱风格": "turn this photo into a cute anime figure with kawaii style, sitting pose, pastel colors",
  "英雄风格": "turn this photo into a heroic action figure, dynamic pose, detailed costume and accessories",
  "Q版风格": "turn this photo into a chibi-style figure, super deformed proportions, big head and eyes",
  "写实风格": "turn this photo into a realistic detailed figure, museum quality, fine details and textures"
}
```

## 规则说明

- **格式**: `"按钮名称": "提示词内容"`
- **按钮名称**: 显示在按钮上的中文名称，简洁明了
- **提示词内容**: 英文的详细描述，用于AI生成
- **自动布局**: 按钮会自动按照 2 列网格布局排列
- **扩展性**: 添加新的键值对即可自动生成新按钮

## 当前配置

目前只保留了 "默认手办" 一个预设，如需添加更多预设，请在对象中添加新的键值对即可。