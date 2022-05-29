import React from 'react';

const EmptyView = (props) => {
  const text = props.pageIsLoading ? "Loading..." : "Oops, something went wrong!!";
  console.log("[EmptyView]", {props})
  return (
    <div className="block-txt">
    <p className='row-txt'>{text}</p>
    </div>
  );
}

export default EmptyView;
