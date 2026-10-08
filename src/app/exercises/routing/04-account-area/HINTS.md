# L4 - Hints

<details><summary>Hint 1 - nudge</summary>

All four symptoms are about how the nested route tree is wired. Draw it: which route owns which
component, who renders whose children, and where do the links start from?

</details>

<details><summary>Hint 2 - area</summary>

- A routed component with children needs somewhere to show them. What renders the child component?
- A `routerLink` starting with `/` and `router.navigate([...])` without `relativeTo` both resolve
  from the **root**. Which one do you want inside a nested area?
- When does a guard on a parent route run again while the user moves between its children?
  There is a sibling guard type for exactly this.

</details>

<details><summary>Hint 3 - near the answer</summary>

Add `<router-outlet />` to the component that has `children`. Use `[routerLink]="[order.id]"` and
`router.navigate(['..'], { relativeTo: route })` (or `routerLink=".."`). Move the guard to
`canActivateChild`.

</details>
