pipeline {
    agent any

    tools {
        nodejs "NodeJS"         // configure-le plus tard dans Manage Jenkins → Tools
    }

    triggers {
        // Vérifie toutes les 5 minutes s’il y a un nouveau commit
        pollSCM('H/5 * * * *')
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'gestionRanim',
                    credentialsId: 'github-credentials', 
                    url: 'https://github.com/ranimbenali/GMAO.git'
            }
        }

        stage('Frontend Build (Angular)') {
    steps {
        dir('gmao-angular') {
            sh '''
                echo "📁 Position actuelle :"
                pwd && ls -la
                npm ci
                npx -y @angular/cli@20 build --configuration production
            '''
        }
    }
}




        stage('Backend Build (NestJS)') {
  steps {
    sh '''
      set -eux
      if [ -f gmao-nest/package.json ]; then
        cd gmao-nest
      fi

      echo "== PWD et fichiers (Nest) =="
      pwd
      ls -la

      [ -f package.json ] && head -n 40 package.json || echo "pas de package.json ici"

      npm ci || npm install

      # Lance Nest de façon fiable
      npx -y -p @nestjs/cli@10 nest build
    '''
  }
}


        stage('Archive Results') {
            steps {
                archiveArtifacts artifacts: '**/dist/**', fingerprint: true
            }
        }
    }

    post {
        success {
            echo "✅ Build GMAO (Angular + Nest) terminé avec succès !"
        }
        failure {
            echo "❌ Erreur lors du build, vérifie les logs Jenkins."
        }
    }
}
