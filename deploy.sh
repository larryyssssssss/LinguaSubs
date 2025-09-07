#!/bin/bash

# LinguaSubs 部署脚本

echo "==================================="
echo "    LinguaSubs 部署脚本"
echo "==================================="
echo

# 检查是否有未提交的更改
if [[ -n $(git status --porcelain) ]]; then
    echo "检测到未提交的更改，正在添加并提交..."
    git add .
    
    # 获取提交信息
    echo "请输入提交信息:"
    read commit_message
    
    # 提交更改
    git commit -m "$commit_message"
    echo "更改已提交。"
    echo
else
    echo "没有检测到未提交的更改。"
    echo
fi

# 推送到GitHub
echo "正在推送到GitHub..."
echo "注意：如果这是第一次推送，可能需要输入GitHub凭据。"
echo

# 尝试推送
git push -u origin main

# 检查推送是否成功
if [ $? -eq 0 ]; then
    echo
    echo "✅ 部署成功！"
    echo "您的代码已成功推送到GitHub仓库。"
else
    echo
    echo "❌ 部署失败！"
    echo "推送失败，可能是因为身份验证问题。"
    echo
    echo "解决方法："
    echo "1. 确保您有该仓库的写入权限"
    echo "2. 使用GitHub个人访问令牌进行身份验证"
    echo "3. 或者配置SSH密钥"
    echo
    echo "您可以手动运行以下命令来推送："
    echo "cd /Users/tantan/code/LinguaSubs"
    echo "git push -u origin main"
fi

echo
echo "==================================="
echo "           部署完成"
echo "==================================="
echo
echo "最新更新："
echo "- 添加了状态管理器 (stateManager.js)"
echo "- 实现了缓存机制和预加载技术"
echo "- 优化了应用性能和用户体验"