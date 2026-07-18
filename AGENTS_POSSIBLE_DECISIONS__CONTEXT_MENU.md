# Choosing a JavaScript/jQuery Context Menu Library

If you need a custom right-click context menu, there are several mature libraries available depending on whether you're using vanilla JavaScript or jQuery.

## Recommended Libraries

### 1. jQuery-contextMenu ⭐ Recommended for jQuery

If your project already uses jQuery, this is one of the most feature-complete libraries available.

Features:

- Mature and well maintained
- Nested menus
- Keyboard navigation
- Dynamic menu generation
- Enable/disable menus at runtime
- Extensive callback support

Example:

```js
$.contextMenu({
    selector: '#myElement',
    items: {
        edit: {
            name: "Edit",
            callback: function () {
                console.log("Edit");
            }
        },
        delete: {
            name: "Delete",
            callback: function () {
                console.log("Delete");
            }
        }
    }
});
```

---

### 2. Tippy.js

Although primarily a tooltip/popover library, Tippy can also be used for context menus.

Pros

- Modern
- Lightweight
- Works great with Tailwind
- Highly customizable

Best if you want complete control over the menu's appearance.

---

### 3. ContextMenu.js

A lightweight vanilla JavaScript context menu library.

Pros

- No jQuery dependency
- Small footprint
- Simple API
- Easy customization

---

# Showing the Context Menu Only When a Condition Is True

One of the nicest features of **jQuery-contextMenu** is the `build()` callback.

Instead of defining the menu once, the menu can be built each time the user right-clicks.

```js
let enableContextMenu = true;

$.contextMenu({
    selector: '#myElement',

    build: function ($trigger, e) {

        if (!enableContextMenu) {
            return false;
        }

        return {

            callback: function(key) {
                console.log(key);
            },

            items: {
                edit: { name: "Edit" },
                delete: { name: "Delete" }
            }
        };
    }
});
```

Returning `false` from `build()` prevents the menu from opening.

This is usually cleaner than constantly creating and destroying menus.

---

# Registering Using a jQuery Object

Suppose you have

```js
let $taskEl = $('.task');
```

A common assumption is that this works:

```js
$.contextMenu({
    selector: $taskEl
});
```

Unfortunately it does **not**.

`selector` accepts **only a CSS selector string**, not a jQuery object.

For example, these are valid:

```js
selector: ".task"
selector: "#task42"
selector: "li.todo"
```

These are **not**:

```js
selector: $taskEl
selector: document.getElementById(...)
selector: HTMLElement
```

---

# Getting a Selector from a jQuery Object

If your element already has an ID:

```js
let selector = "#" + $taskEl.attr("id");
```

If it has only classes:

```js
let selector =
    "." + $taskEl.attr("class").split(" ").join(".");
```

However, neither of these guarantees uniqueness.

---

# Generating a Unique Selector

If you truly need a selector that uniquely identifies a single element, you can walk up the DOM and build a full CSS path.

```js
function getUniqueSelector(el) {

    let path;
    let node = el;

    while (node && node.nodeType === Node.ELEMENT_NODE) {

        let name = node.nodeName.toLowerCase();

        if (node.id) {
            return "#" + node.id;
        }

        let siblings =
            Array.from(node.parentNode.children)
                .filter(n => n.nodeName === node.nodeName);

        if (siblings.length > 1) {
            name +=
                `:nth-child(${Array.prototype.indexOf.call(
                    node.parentNode.children,
                    node
                ) + 1})`;
        }

        path = name + (path ? " > " + path : "");
        node = node.parentNode;
    }

    return path;
}
```

Usage:

```js
let selector = getUniqueSelector($taskEl[0]);

$.contextMenu({
    selector: selector,
    ...
});
```

---

# A Better Approach: Give the Element a Temporary Unique ID

If you control the element, this is generally simpler and more reliable than generating a CSS path.

```js
if (!$taskEl.attr("id")) {
    $taskEl.attr(
        "id",
        "ctx-" + crypto.randomUUID()
    );
}

$.contextMenu({
    selector: "#" + $taskEl.attr("id"),
    ...
});
```

This avoids long `:nth-child()` selectors that can break if the DOM changes.

---

# Complete Example

```js
let enableContextMenu = true;

// Your jQuery object
let $taskEl = $("#myTask");

// Ensure the element has a unique ID
if (!$taskEl.attr("id")) {
    $taskEl.attr("id", "ctx-" + crypto.randomUUID());
}

$.contextMenu({

    selector: "#" + $taskEl.attr("id"),

    build: function () {

        if (!enableContextMenu) {
            return false;
        }

        return {

            callback: function(key) {
                console.log(key);
            },

            items: {
                edit: {
                    name: "Edit"
                },

                delete: {
                    name: "Delete"
                }
            }
        };
    }
});
```

---

# Summary

| Requirement | Recommended Solution |
|-------------|----------------------|
| Modern vanilla JS | Tippy.js or ContextMenu.js |
| Existing jQuery project | jQuery-contextMenu |
| Show menu only under certain conditions | Use `build()` and return `false` |
| Register using a jQuery object | Not supported directly |
| Need a selector for a jQuery object | Use its ID, generate a unique CSS selector, or assign a temporary unique ID |
| Most robust approach | Assign a unique ID and use `selector: "#id"` |

For dynamically created elements, assigning each element a unique ID (or another unique attribute such as `data-context-id`) is typically the cleanest and most maintainable solution.