#!/bin/bash

# Any future command that fails will exit the script
set -e

# Delete the old repo
rm -rf ~/quesera/
mkdir ~/quesera

# Clone the repo again
eval $(ssh-agent -s)
ssh-add ~/.ssh/git_rsa
cd ~/quesera
git clone git@gitlab.com:uniworld/uni3.0/quesera/be-api-server.git

# Install npm packages
cd ~/quesera/be-api-server
echo "Running npm install..."
npm install

# Start pm2 application
echo "Starting BE_API_SERVER application..."
pm2 kill
pm2 start npm --name "BE_API_SERVER" -- start
