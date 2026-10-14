export class Collision {

    static checkCollision(a, b) {
        return (
            a.transform.x < b.transform.x + b.width &&
            a.transform.x + a.width > b.transform.x &&
            a.transform.y < b.transform.y + b.height &&
            a.transform.y + a.height > b.transform.y
        );
    }

    static checkPlayerWall(player, wall) {
        return this.checkCollision(player, wall);
    }
}
