**jQuery ContextMenu**:

Docs:
[https://swisnl.github.io/jQuery-contextMenu/docs.html](https://swisnl.github.io/jQuery-contextMenu/docs.html)

---

## Installation

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>

<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.7.1/jquery.contextMenu.min.css"
>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.7.1/jquery.contextMenu.min.js"></script>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-contextmenu/2.7.1/jquery.ui.position.js"></script>
```

---

## Basic Context Menu

```javascript
$(function () {
  $.contextMenu({
    selector: "#myElement",

    items: {
      edit: {
        name: "Edit",
        callback: function () {
          alert("Edit clicked");
        }
      },

      delete: {
        name: "Delete",
        callback: function () {
          alert("Delete clicked");
        }
      }
    }
  });
});
```

The `selector` option expects a **CSS selector string**, not a jQuery object such as `$taskEl`.

For a specific task element, assign it a unique ID:

```javascript
$taskEl.attr("id", `task-${task.id}`);
```

Then register the menu using that ID:

```javascript
selector: `#task-${task.id}`
```

---

## Trigger Options

### Right-click

Right-click is the default behavior:

```javascript
$.contextMenu({
  selector: ".context-menu"
});
```

### Left-click

```javascript
$.contextMenu({
  selector: "span.context-menu",
  trigger: "left"
});
```

### Hover

```javascript
$.contextMenu({
  selector: "span.context-menu",
  trigger: "hover"
});
```

---

## Conditionally Show the Menu

Use `build` when the menu should only appear under certain conditions.

Returning `false` prevents the menu from opening.

```javascript
$.contextMenu({
  selector: `#task-${task.id}`,
  trigger: "left",

  build: function ($triggerElement, event) {
    let element = event.target;

    if (!element.matches("[data-task-type]")) {
      element = element.closest("[data-task-type]");
    }

    if (!element) {
      return false;
    }

    if ($(element).attr("data-status") !== "active") {
      return false;
    }

    return {
      callback: function (key) {
        switch (key) {
          case "perform":
            alert("Coming soon!");
            break;

          case "details": {
            const durationMins = $(element).data("duration-mins");
            const expire = $(element).data("expire");

            alert(
              `Task is ${durationMins} minutes long. Expires at ${expire}.`
            );
            break;
          }
        }
      },

      items: {
        perform: {
          name: "Perform",
          icon: "add"
        },

        details: {
          name: "Details",
          icon: "question"
        }
      }
    };
  }
});
```

---

## Example Task HTML

```html
<div
  id="task-123"
  data-task-type="scheduled"
  data-status="active"
  data-duration-mins="30"
  data-expire="4:30 PM"
>
  <span>Example Task</span>
</div>
```

The user can click a nested element such as the `<span>`. The `closest()` lookup finds the parent containing `data-task-type`.

---

## Custom HTML Menu Items

ContextMenu supports HTML items:

```javascript
items: {
  help: {
    type: "html",
    html: `
      <div class="hover:bg-blue-500">
        <i
          class="fa fa-question absolute left-2.5 top-1.5"
          style="color: #2980b9"
        ></i>
        <span>Help</span>
      </div>
    `
  }
}
```

Use a regular item when you only need a name, icon, and callback. Use `type: "html"` when the menu item needs custom markup or styling.

---

## Key Points

* `selector` must be a CSS selector string.
* Give a single task element a unique ID when targeting it individually.
* Use `trigger: "left"` for left-click menus.
* Use `build` to generate menu items dynamically.
* Return `false` from `build` to prevent the menu from opening.
* Use `closest()` when the clicked element may be nested inside the task element.
* Use `type: "html"` for custom menu-item markup.
