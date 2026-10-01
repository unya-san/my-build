export class Input{
  static left = false;
  static right = false;

  static initialize(){
    window.addEventListener("keydown", (event) => {
      if(event.key === "ArrowLeft") {
        Input.left = true;
      }
      if(event.key === "ArrowRight") {
        Input.right = true;
      }
      if(event.code === "Space") {
        Input.space = true;
        event.preventDefault();
      }
    });

    window.addEventListener("keyup", (event) => {
      if(event.key === "ArrowLeft") {
        Input.left = false;
      }
      if(event.key === "ArrowRight") {
        Input.right = false;
      }
      if(event.code === "Space") {
        Input.space = false;
      }
    });
  }
}