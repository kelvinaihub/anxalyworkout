# iOS Build Setup

This project has been configured to build an iOS app (IPA) using Capacitor and GitHub Actions.

## Prerequisites

1.  **GitHub Repository**: You need to create a repository on GitHub and push this code to it.
2.  **GitHub Actions**: The build process is automated via `.github/workflows/build_ios.yml`.

## How to Build

1.  **Push to GitHub**:
    ```bash
    git remote add origin <your-github-repo-url>
    git branch -M main
    git push -u origin main
    ```
2.  **Check Actions**: Go to the "Actions" tab in your GitHub repository. You should see a workflow named "Build iOS IPA" running.
3.  **Download IPA**: Once the build finishes, click on the workflow run, and you will find the `ios-app-unsigned` artifact at the bottom. Download and unzip it to get the `.ipa` file.

## Important Note on Signing

The current build produces an **unsigned** IPA. This file **cannot be installed on a physical iPhone** directly. It is useful for verification or for submitting to signing services.

To build an installable IPA (Ad-Hoc or App Store), you need to:
1.  Obtain an Apple Developer Account.
2.  Create a Distribution Certificate and Provisioning Profile.
3.  Add these as secrets to your GitHub repository (`BUILD_CERTIFICATE_BASE64`, `P12_PASSWORD`, `BUILD_PROVISION_PROFILE_BASE64`).
4.  Update the `build_ios.yml` workflow to use these secrets for signing (using `apple-actions/import-codesign-certs` and `gym`).
