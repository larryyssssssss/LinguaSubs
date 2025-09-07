#!/bin/bash

# LinguaSubs 部署脚本

echo "正在部署 LinguaSubs 应用..."

# 添加所有更改
git add .

# 获取提交信息
echo "请输入提交信息:"
read commit_message

# 提交更改
git commit -m "$commit_message"

# 推送到GitHub
git push origin main

echo "部署完成！"