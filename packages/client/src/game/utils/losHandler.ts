/*

  public getDistanceToCollision() {
    //let distanceToCollision = 100;
    if (this.mesh) {
      const rayOrigin = this.mesh.position.clone();
      rayOrigin.y += 0.5; // start just above the character's feet
      const rayDirection = this.getMovePOV(this.mesh);
      const rayLength = 100;
      const ray = new Ray(rayOrigin, rayDirection, rayLength);

      // Pick the closest mesh below
      const pickInfo = this.mesh.getScene().pickWithRay(ray, undefined, true);

      if (pickInfo?.hit && pickInfo.pickedPoint) {
        const groundPoint = pickInfo.pickedPoint;

        console.log('GROUND POINT', this.mesh.collider);
        // distanceToCollision = this.mesh.position.z - groundPoint.z;
      }
    }
  }

*/
