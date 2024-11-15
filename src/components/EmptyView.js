import React from "react";

const EmptyView = (props) => {
  return (
    <div className="block-txt">
      {props.pageIsLoading ? (
        <div class="dot-spinner">
          <div class="dot-spinner__dot"></div>
          <div class="dot-spinner__dot"></div>
          <div class="dot-spinner__dot"></div>
          <div class="dot-spinner__dot"></div>
          <div class="dot-spinner__dot"></div>
          <div class="dot-spinner__dot"></div>
          <div class="dot-spinner__dot"></div>
          <div class="dot-spinner__dot"></div>
        </div>
      ) : (
        <div>
          <p className="row-txt">Oops, something went wrong!!</p>
        </div>
      )}
    </div>
  );
};

export default EmptyView;
