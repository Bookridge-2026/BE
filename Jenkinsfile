pipeline {
  agent any
  stages {
    stage('Checkout code') {
      steps { checkout scm }
    }
    stage('Build image') {
      steps {
        script { myapp = docker.build("suruna/bookridge:${env.BUILD_ID}") }
      }
    }
    stage('Test image') {
      steps {
        script { myapp.inside { sh 'node --check app.js' } }
      }
    }
    stage('Push image') {
      steps {
        script {
          docker.withRegistry('https://registry.hub.docker.com', 'dockerhub') {
            myapp.push("latest")
            myapp.push("${env.BUILD_ID}")
          }
        }
      }
    }
  }
}
