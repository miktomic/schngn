# Google signup production setup

This runbook configures Google signup for the SCHNGN **Clerk production instance**. Google is the OAuth provider, Clerk owns the authentication flow, and SCHNGN receives the verified Clerk session. No Google OAuth credential belongs in the repository, GitHub Actions, or Cloudflare Worker bindings.

Official references:

- [Clerk: add Google as a social connection](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google)
- [Google: manage OAuth app branding](https://support.google.com/cloud/answer/15549049?hl=en)
- [Google: production OAuth policy checklist](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance)
- [Google: create web-server OAuth credentials](https://developers.google.com/identity/protocols/oauth2/web-server)

## Values for SCHNGN

Use these exact public URLs:

| Google or Clerk field | Value |
|---|---|
| App name | `SCHNGN` |
| Homepage | `https://schngn.com/` |
| Privacy Policy | `https://schngn.com/privacy` |
| Terms of Service | `https://schngn.com/terms` |
| Authorized domain | `schngn.com` |
| Authorized JavaScript origin | `https://schngn.com` |
| Authorized redirect URI | `https://clerk.schngn.com/v1/oauth_callback` |
| Public support address | `support@schngn.com` |

Do not add a trailing slash to the JavaScript origins or callback. The callback must match the value displayed by Clerk exactly.

## Before public verification

You may create the client credentials and run a controlled test with a listed Google test user before this checklist is complete. Do not request brand verification or move the app to **In production** until all of it is complete.

1. Replace the draft policy's generic SCHNGN operator wording with the real controller/operator legal name, address or jurisdiction details required for that operator, and reviewed contact details. Obtain appropriate legal review and native-language review before treating the localized documents as final.
2. Deploy the reviewed homepage, Privacy Policy, and Terms of Use on the production domain.
3. Confirm all three URLs load publicly without sign-in.
4. Confirm the homepage footer links to both legal pages.
5. Use a Google account that is an Owner or Editor of the `schngn` Google Cloud project.
6. Verify ownership of `schngn.com` in [Google Search Console](https://search.google.com/search-console/). A Domain property verified with a Cloudflare DNS TXT record is the most durable option.

Google requires the privacy URL on the OAuth screen to match the public policy linked from the homepage. Google also requires the domains used by the homepage, policy, terms, redirect URI, and JavaScript origins to be owned and verified for a production app.

## 1. Complete Google Auth Platform branding

In Google Cloud Console, select the production `schngn` project, then open:

```text
Google Auth Platform → Branding
```

Set:

- App name: `SCHNGN`
- User support email: a monitored address available in the selector
- App logo: the approved square [`apps/web/static/icons/icon-192.png`](../apps/web/static/icons/icon-192.png); it is a 192×192 PNG under Google’s size limit
- Application home page: `https://schngn.com/`
- Application privacy policy: `https://schngn.com/privacy`
- Application terms of service: `https://schngn.com/terms`
- Authorized domain: `schngn.com`
- Developer contact: a monitored project-owner address

Save the draft branding. The homepage must describe SCHNGN and expose the same privacy link in its footer.

## 2. Configure the audience for a controlled test

Open:

```text
Google Auth Platform → Audience
```

Keep **External** as the user type.

While publishing status is **Testing**, add the Google accounts that will run the controlled test under **Test users**. A person who is not listed may be blocked even when the client credentials are correct.

Testing status is temporary setup state, not the final public configuration. After the end-to-end flow is proven and branding is ready, publish the app for the intended public audience.

## 3. Keep data access minimal

Open:

```text
Google Auth Platform → Data Access
```

SCHNGN needs only the basic identity scopes used by Clerk:

- `openid`
- `.../auth/userinfo.email`
- `.../auth/userinfo.profile`

Do not add Gmail, Drive, Calendar, Contacts, or other scopes. The SCHNGN Privacy Policy discloses basic identity data used to create and authenticate the account, identify the active signed-in user, display account state, and associate trips the user explicitly chooses to save.

## 4. Create a fresh production web client

The existing `Web client 1` was created without origins or redirects, and its original secret may no longer be available. Google shows a client secret only at creation. If the original secret was not retained securely, create a new client instead of trying to recover or guess it.

Open:

```text
Google Auth Platform → Clients → Create client
```

Choose:

- Application type: **Web application**
- Name: `SCHNGN production via Clerk`

Add this authorized JavaScript origin:

```text
https://schngn.com
```

Do not add `https://www.schngn.com`: it only redirects to the apex and never runs the OAuth flow.

Add this single authorized redirect URI:

```text
https://clerk.schngn.com/v1/oauth_callback
```

Do not add localhost or preview domains to this production client.

Select **Create**. Google will show the Client ID and Client Secret. Keep that result open while completing the next section.

## 5. Paste credentials directly into Clerk Production

In another normal browser tab, open the Clerk Dashboard and select the **Production** instance:

```text
Clerk → SSO connections → Google
```

Confirm:

- **Enable for sign-up and sign-in** is on.
- **Use custom credentials** is on.
- **Block email subaddresses** remains on unless there is a reviewed reason to change it.
- The displayed Authorized Redirect URI is exactly `https://clerk.schngn.com/v1/oauth_callback`.

Copy the Google **Client ID** into Clerk's Client ID field. Copy the Google **Client Secret** directly into Clerk's Client Secret field, then save.

Credential-handling rules:

- Do not paste the secret into chat, a terminal command, a screenshot, documentation, the repository, GitHub, or Cloudflare.
- Do not create a SCHNGN environment variable for either Google value. Clerk stores and uses both values.
- The Client ID is not confidential, but SCHNGN still has no reason to duplicate it in application code.
- If the secret is exposed or lost, rotate/recreate the Google client and update Clerk immediately.

## 6. Test before publishing

Use normal Chrome, Safari, Firefox, or Edge. Google blocks OAuth inside many embedded WebViews and in-app browsers.

Test in this order:

1. In Clerk Production, open **Account Portal** and launch its sign-in page.
2. Choose Google and sign in with an account listed as a Google test user.
3. Confirm the Google flow returns to Clerk without `redirect_uri_mismatch`, `invalid_client`, or access-denied errors.
4. Sign out.
5. In a new private browser window, open `https://schngn.com/app`.
6. Add a synthetic trip, select **Sign up & save**, then choose Google in the SCHNGN-styled Clerk modal.
7. Confirm signup returns to the same calculator, the account state becomes signed in, and the explicit save action synchronizes only the synthetic trip snapshot.
8. Refresh and confirm the saved account trip is available.
9. Test the browser JSON export, delete saved account trips, and sign-out/clear-browser behavior with synthetic data.

Google and Clerk configuration changes can take several minutes to propagate. A stale failure immediately after saving is not conclusive; retry in a fresh private window after a short interval.

## 7. Publish and verify the production app

After the controlled test succeeds:

1. Return to **Google Auth Platform → Branding**.
2. Start **Verify branding** if the dashboard offers it.
3. Resolve any check for domain ownership, homepage identity, footer policy link, policy/terms URL, logo, or support contact.
4. When status becomes **Ready to publish**, select **Publish branding** within Google's displayed validity window.
5. Open **Audience** and move the app from **Testing** to **In production** for public users.
6. Complete any additional review Google displays. With only `openid`, email, and profile, SCHNGN should not request sensitive Gmail/Drive-style scope review, but Google controls the final review path.
7. Repeat the Account Portal and SCHNGN end-to-end tests using a Google account that was not a test user.
8. After the new client is proven, remove the unused unfinished `Web client 1` so future maintenance cannot select the wrong credential pair.

## Troubleshooting map

| Symptom | Most likely check |
|---|---|
| Clerk says custom credentials are missing | Client ID and Client Secret were not saved in the Clerk **Production** Google connection |
| `redirect_uri_mismatch` | Google callback does not exactly equal `https://clerk.schngn.com/v1/oauth_callback` |
| `invalid_client` | Wrong ID/secret pair, deleted client, or secret copied incompletely |
| Access blocked while status is Testing | Google account is not in **Audience → Test users** |
| Consent screen shows only a domain or unverified branding | Complete and publish Google brand verification |
| Google works in Account Portal but not SCHNGN | Check browser console/CSP and confirm the request starts on `https://schngn.com` |
| Popup stalls in an embedded browser | Repeat in a normal external browser; Google does not support WebView authentication |

Changing Google/Clerk dashboard settings does not require an SCHNGN redeploy. Adding or changing the public Privacy Policy, Terms, footer, or homepage does require the normal verified deployment workflow.
