# Feature additions V3.0

## Delete Rental Item

User who owns the item should be able to delete the rental item they have listed. Once this feature is added, add test cases to test this.

## Check Availability while adding to cart

Design a solution to track each item and the dates when they are rented and/or blocked. Make sure database has the reason why it is not available (as in rented by user XXX or blocked by owner). If an user tries to rent an item that is already rented for any day, then that item should not be added to cart. Instead, it should report an error that the item is already rented for one or more days. Add test to verify this.

## Create Rented items view

This screen should show all items rented by the signed in user. Make it a scrollable list view, with each row showing one item that has been rented. It should show all details such as image, title, description, rate, total cost, start and end date. If item is overdue, that row should be highlighted in red. create appropriate backend to store these rented items in database. Add tests to verify this.

## Checkout option

Add a check-out button to cart view so that user can do the check out. During checkout (when checkout button is pressed), make sure each item in the cart is not deleted and is still available on the days requested. If successful, add items to "rented view". If not, show error and remove the offending item from the cart while retaining all other items that are ok. Add test to verify this.

# Test cases

## Test-001: CRUD of rental item

1. login as user "raj" add a rental item with title="raj-test-item", Category="Electronics", with daily rate of $2, weekly rate of $10, minimum rental = 7 days.
2. add "raj-test-item" to cart with start date of 5/15/26 and end date of 5/18/26
3. verify cart has this item
4. remove item from cart