#!/bin/bash

# Any future command that fails will exit the script
set -e

# Write the public key of our aws instance
eval $(ssh-agent -s)
echo "$SERVER_PRIVATE_KEY" | tr -d '\r' | ssh-add - > /dev/null

# Disable the host key checking.
chmod +x ./deploy/disableHostKeyChecking.sh
./deploy/disableHostKeyChecking.sh

# We have already setup the DEPLOYER_SERVERS in our gitlab settings which is a
# comma seperated values of IP addresses.
DEPLOY_SERVERS=$DEPLOY_SERVERS

# Split this string and convert this into array
# In UNIX, we can use this commond to do this
# ${string//substring/replacement}
# our substring is "," and we replace it with nothing.
ALL_SERVERS=(${DEPLOY_SERVERS//,/ })
echo "ALL_SERVERS ${ALL_SERVERS}"

# Iterate over this array and ssh into each EC2 instance
# Once inside the server, run server.sh
for server in "${ALL_SERVERS[@]}"
do
  echo "Deploying to ${server}"
  ssh ubuntu@${server} 'bash' < ./deploy/server.sh
done

