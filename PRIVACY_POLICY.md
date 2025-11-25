# Privacy Policy for X-additional-Info

**Last Updated: November 25, 2024**

## Overview

X-additional-Info ("the Extension") is a Chrome browser extension that displays additional transparency information about user accounts on X (formerly Twitter). This privacy policy explains how the Extension handles data.

## Data Collection and Usage

### What Data We Access

The Extension accesses the following data from X's official public GraphQL API:
- Account location (country where the account is based)
- VPN/Proxy detection status (based on location accuracy)
- Account name change count

### How We Use This Data

- **Display Only**: All data retrieved is used solely to display information to you within the X interface
- **Local Storage**: Data is cached locally in your browser using Chrome's storage API for 24 hours to reduce API calls
- **No External Transmission**: We do NOT send, transmit, or share any data with external servers or third parties
- **No Analytics**: We do NOT collect analytics, usage statistics, or any personal information

### What We Store Locally

The Extension stores the following data in your browser's local storage:
- Cached transparency data for X user accounts you've viewed
- Your extension settings (e.g., timeline icons ON/OFF preference)
- Cache version number for data management

All stored data remains on your device and is never transmitted elsewhere.

## Permissions Justification

The Extension requires the following permissions:

- **`storage`**: To cache user transparency data locally and save your settings
- **`host_permissions` for x.com**: To access X's GraphQL API to fetch transparency information

## Third-Party Services

The Extension interacts with:
- **X (Twitter) GraphQL API**: We use X's official public API to retrieve transparency data. This interaction is subject to X's own privacy policy and terms of service.

We do NOT use any other third-party services, analytics tools, or tracking services.

## Data Retention

- Cached data is automatically invalidated after 24 hours
- You can clear all cached data at any time by:
  - Removing the extension
  - Clearing your browser's extension data
  - Updating the extension (which clears old cache versions)

## User Control

You have full control over the Extension:
- Toggle timeline icons ON/OFF via the extension popup
- Uninstall the extension at any time to remove all stored data
- No account creation or login required

## Children's Privacy

The Extension does not knowingly collect any information from children under 13. The Extension is designed for general use and does not target children.

## Changes to This Privacy Policy

We may update this privacy policy from time to time. Any changes will be reflected in the "Last Updated" date at the top of this document. Continued use of the Extension after changes constitutes acceptance of the updated policy.

## Contact

If you have questions or concerns about this privacy policy, please contact us through:
- GitHub Issues: https://github.com/pnizo/x-additional-info/issues

## Compliance

This Extension complies with:
- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)

## Your Rights

Under GDPR and CCPA, you have the right to:
- Access your data (all data is stored locally on your device)
- Delete your data (uninstall the extension or clear browser data)
- Opt-out of data processing (disable or uninstall the extension)

Since all data is stored locally and we don't collect any personal information, you have complete control over your data at all times.

---

**Summary**: X-additional-Info does not collect, transmit, or share any personal data. All functionality is local to your browser, and we respect your privacy completely.
