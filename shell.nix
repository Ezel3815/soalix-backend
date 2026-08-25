{ pkgs ? import <nixpkgs> { inherit system; }, system ? builtins.currentSystem
}:

let nodePackages = import ./default.nix { inherit pkgs system; };
in nodePackages // {
  shell = nodePackages.bufferutil.override {
    buildInputs = with pkgs; [
      pkgs.nodePackages.node-gyp-build
    ];
  };
}
