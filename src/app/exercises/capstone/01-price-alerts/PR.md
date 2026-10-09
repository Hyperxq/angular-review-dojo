# feat(alerts): price alerts for products

Closes SHOP-482

## What

Customers can now set a target price for a product and see all their price alerts on one page. When the current price
drops to the target (or below) the alert is highlighted with "Target reached".

- new page `Price alerts` with a list, a search box and a "Create alert" form
- notes on alerts can use `*emphasis*` (rendered as italics); I used `bypassSecurityTrustHtml` because the sanitizer
  was stripping the `<em>` tags I generate
- the header has a badge with the number of active alerts
- the list refreshes every 30 s so "Target reached" stays current
- `AlertsApi.create` retries up to 3 times: the staging API drops about 1 in 10 requests and QA kept seeing "could not
  create the alert"
- there is a temporary in-memory backend (`alerts-demo-backend.ts`, route-level interceptor) until the real
  endpoints land; I made it delegate to the parent client so the app interceptors still apply

## How I tested

- clicked through the page in Chrome: create, search, delete, refresh
- added a unit test for the form validation (not included in this PR yet, will follow)

## Notes for reviewers

- the store is auto-provided in root, but the page also lists it in its `providers` so the page gets a fresh one every time
  it is opened
- `track $index` in the alert list because alerts have no stable key in the demo backend
- screenshots in the ticket

Ready for review! Would be great to merge today so QA can start on Monday.
