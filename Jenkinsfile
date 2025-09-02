pipeline {
  agent any

  environment {
    REGISTRY        = "10.243.4.236:5000"
    TAG             = "latest"
    DOCKER_HOST     = "tcp://10.243.52.185:2375"
    APP_NETWORK     = "app"

    FRONTEND_IMAGE  = "halfskirmish_notes_frontend"
    BACKEND_IMAGE   = "halfskirmish_notes_backend"
    
    // Deployment names following the pattern
    FRONTEND_DEPLOYMENT = "halfskirmish-notes-frontend"
    BACKEND_DEPLOYMENT  = "halfskirmish-notes-backend"
    CLOUDFLARED_DEPLOYMENT = "halfskirmish-notes-cloudflared"

    FRONTEND_BUILD_CONTEXT = "frontend/notes-app"
    BACKEND_BUILD_CONTEXT  = "backend"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build Images') {
      steps {
        script {
          echo "Building frontend image..."
          // Build frontend and pass build arg so NEXT_PUBLIC_BASE_URL embeds backend address
          sh """
            docker build -t ${FRONTEND_IMAGE}:${TAG} \\
              --build-arg NEXT_PUBLIC_BASE_URL=http://${BACKEND_DEPLOYMENT}:5000 \\
              -f ${FRONTEND_BUILD_CONTEXT}/Dockerfile ${FRONTEND_BUILD_CONTEXT}
          """

          echo "Building backend image..."
          sh """
            docker build -t ${BACKEND_IMAGE}:${TAG} -f ${BACKEND_BUILD_CONTEXT}/Dockerfile ${BACKEND_BUILD_CONTEXT}
          """
        }
      }
    }

    stage('Tag + Push') {
      steps {
        script {
          echo "Starting Tag + Push stage..."
          
          // Check if images exist
          sh "docker images | grep ${FRONTEND_IMAGE} || echo 'Frontend image not found!'"
          sh "docker images | grep ${BACKEND_IMAGE} || echo 'Backend image not found!'"
          
          // Tag images
          echo "Tagging images..."
          sh "docker tag ${FRONTEND_IMAGE}:${TAG} ${REGISTRY}/${FRONTEND_IMAGE}:${TAG}"
          sh "docker tag ${BACKEND_IMAGE}:${TAG} ${REGISTRY}/${BACKEND_IMAGE}:${TAG}"
          
          echo "Images tagged successfully"
          
          // Try to push without credentials first (if registry allows it)
          echo "Attempting to push images..."
          sh "docker push ${REGISTRY}/${FRONTEND_IMAGE}:${TAG}"
          sh "docker push ${REGISTRY}/${BACKEND_IMAGE}:${TAG}"
          
          echo "Images pushed successfully"
        }
      }
    }

    stage('Deploy to remote Docker host') {
      steps {
        script {
          echo "Starting deployment to remote Docker host..."
          
          // Test remote Docker connection first
          echo "Testing remote Docker connection..."
          sh "docker -H ${DOCKER_HOST} version || (echo 'Failed to connect to remote Docker host' && exit 1)"
          
          // Create temp files from Jenkins secrets and deploy containers to remote host
          withCredentials([
            string(credentialsId: 'BACKEND_CONFIG_JSON', variable: 'BACKEND_CONFIG_JSON'),
            file(credentialsId: 'CLOUDFLARE_CREDS_FILE', variable: 'CLOUDFLARE_CREDS_LOCAL'),
            file(credentialsId: 'CLOUDFLARE_CONFIG_FILE', variable: 'CLOUDFLARE_CONFIG_LOCAL')
          ]) {
            sh '''
              set -e
              
              echo "=== STEP 1: Writing backend config ==="
              # write backend config.json from secret-text to workspace file
              printf "%s" "$BACKEND_CONFIG_JSON" > backend-config.json
              echo "Wrote backend-config.json (workspace)."

              echo "=== STEP 2: Setting up network ==="
              # Ensure remote network exists
              docker -H ${DOCKER_HOST} network inspect ${APP_NETWORK} >/dev/null 2>&1 || \
                docker -H ${DOCKER_HOST} network create ${APP_NETWORK}
              echo "Network ${APP_NETWORK} ready."

              echo "=== STEP 3: Cleaning up old containers ==="
              # Stop + remove old containers if they exist
              echo "Cleaning up frontend..."
              docker -H ${DOCKER_HOST} ps -q --filter name=${FRONTEND_DEPLOYMENT} | grep -q . && docker -H ${DOCKER_HOST} stop ${FRONTEND_DEPLOYMENT} || true
              docker -H ${DOCKER_HOST} ps -aq --filter name=${FRONTEND_DEPLOYMENT} | grep -q . && docker -H ${DOCKER_HOST} rm ${FRONTEND_DEPLOYMENT} || true

              echo "Cleaning up backend..."
              docker -H ${DOCKER_HOST} ps -q --filter name=${BACKEND_DEPLOYMENT} | grep -q . && docker -H ${DOCKER_HOST} stop ${BACKEND_DEPLOYMENT} || true
              docker -H ${DOCKER_HOST} ps -aq --filter name=${BACKEND_DEPLOYMENT} | grep -q . && docker -H ${DOCKER_HOST} rm ${BACKEND_DEPLOYMENT} || true

              echo "Cleaning up cloudflared..."
              docker -H ${DOCKER_HOST} ps -q --filter name=${CLOUDFLARED_DEPLOYMENT} | grep -q . && docker -H ${DOCKER_HOST} stop ${CLOUDFLARED_DEPLOYMENT} || true
              docker -H ${DOCKER_HOST} ps -aq --filter name=${CLOUDFLARED_DEPLOYMENT} | grep -q . && docker -H ${DOCKER_HOST} rm ${CLOUDFLARED_DEPLOYMENT} || true

              echo "=== STEP 4: Pulling images ==="
              # Pull fresh images (optional; docker run will pull if missing)
              echo "Pulling backend image..."
              docker -H ${DOCKER_HOST} pull ${REGISTRY}/${BACKEND_IMAGE}:${TAG} || true
              echo "Pulling frontend image..."
              docker -H ${DOCKER_HOST} pull ${REGISTRY}/${FRONTEND_IMAGE}:${TAG} || true

              echo "=== STEP 5: Deploying backend ==="
              ### BACKEND: create container, copy config.json into it, then start ###
              echo "Creating backend container (stopped)..."
              BACKEND_CID=$(docker -H ${DOCKER_HOST} create --name ${BACKEND_DEPLOYMENT} --network ${APP_NETWORK} ${REGISTRY}/${BACKEND_IMAGE}:${TAG})
              echo "Backend container created: $BACKEND_CID"

              # Copy backend-config.json (local workspace file) into remote container
              echo "Copying config.json into backend container..."
              docker -H ${DOCKER_HOST} cp backend-config.json ${BACKEND_CID}:/app/config.json
              echo "Copied config.json into backend container."

              # Start backend
              echo "Starting backend container..."
              docker -H ${DOCKER_HOST} start ${BACKEND_CID}
              echo "Backend started successfully."

              echo "=== STEP 6: Deploying frontend ==="
              ### FRONTEND: run (frontend expects backend reachable at deployment name inside docker network) ###
              echo "Running frontend container..."
              docker -H ${DOCKER_HOST} run -d --name ${FRONTEND_DEPLOYMENT} --network ${APP_NETWORK} -p 3000:3000 ${REGISTRY}/${FRONTEND_IMAGE}:${TAG}
              echo "Frontend started successfully."

              echo "=== STEP 7: Deploying cloudflared ==="
              ### CLOUDFLARED: create container, copy credentials + config, then start ###
              # Use the official cloudflared image
              CLOUDFLARED_IMG=cloudflare/cloudflared:latest

              echo "Creating cloudflared container..."
              CLOUDFLARED_CID=$(docker -H ${DOCKER_HOST} create --name ${CLOUDFLARED_DEPLOYMENT} --network ${APP_NETWORK} ${CLOUDFLARED_IMG} tunnel run --config /etc/cloudflared/config.yml)
              echo "cloudflared container created: $CLOUDFLARED_CID"

              # copy credentials.json and config.yml into container
              echo "Copying cloudflared credentials and config..."
              docker -H ${DOCKER_HOST} cp "${CLOUDFLARE_CREDS_LOCAL}" ${CLOUDFLARED_CID}:/etc/cloudflared/credentials.json
              docker -H ${DOCKER_HOST} cp "${CLOUDFLARE_CONFIG_LOCAL}" ${CLOUDFLARED_CID}:/etc/cloudflared/config.yml
              echo "Copied cloudflared credentials and config."

              echo "Starting cloudflared container..."
              docker -H ${DOCKER_HOST} start ${CLOUDFLARED_CID}
              echo "cloudflared started successfully."

              echo "=== STEP 8: Final verification ==="
              # give things a second to come up
              sleep 5
              
              # Check container status
              echo "Checking container status..."
              docker -H ${DOCKER_HOST} ps --filter name=${BACKEND_DEPLOYMENT}
              docker -H ${DOCKER_HOST} ps --filter name=${FRONTEND_DEPLOYMENT}
              docker -H ${DOCKER_HOST} ps --filter name=${CLOUDFLARED_DEPLOYMENT}

              echo "Deployment complete."
            '''
          } // withCredentials
        } // script
      } // steps
    } // Deploy stage

    stage('Cleanup Local') {
      steps {
        sh "docker image prune -f || true"
      }
    }
  } // stages

  post {
    success {
      echo "Pipeline finished successfully."
    }
    failure {
      echo "Pipeline failed - check console output."
    }
  }
}