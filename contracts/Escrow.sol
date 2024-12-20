//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Escrow {
    address payable public seller;
    address public inspector;
    address public lender;
    address public nftAddress;

    mapping (uint256 => bool) public isListed;
    mapping (uint256 => uint256) public purchasePrice;
    mapping (uint256 => uint256) public escrowAmount;
    mapping (uint256 => address) public buyer;
    mapping(uint256 => bool) public inspectionPassed;
    mapping (uint256 => mapping (address => bool)) public approval;

    modifier onlySeller {
        require(msg.sender == seller, "Only seller can call this method" );
        _;
    }

    modifier onlyBuyer(uint256 _nftID) {
        require(msg.sender == buyer[_nftID], "Only buyer can call this method");
        _;
    }

    modifier onlyInspector {
        require(msg.sender == inspector, "only inspector can call this method");
        _;
    }

    constructor(address _nftAddress, address payable _seller, address _inspector, address _lender ){
        nftAddress = _nftAddress;
        seller = _seller;
        inspector = _inspector;
        lender = _lender;
    }


    function list(uint256 _nftID, address _buyer, uint256 _purchasePrice,  uint256 _escrowAmount) public onlySeller  {
        // Transfer Nft from seller to this contract
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);
        isListed[_nftID] = true;
        purchasePrice[_nftID] = _purchasePrice;
        escrowAmount[_nftID] = _escrowAmount;
        buyer[_nftID] = _buyer;

    }

    // put under contract (only buyer - payable escrow)

    function depositEarnest(uint256 _nftID) public payable onlyBuyer(_nftID)  {
        require(msg.value >= escrowAmount[_nftID]);
    }


    // update inspection status(only inspector)
    function updateInspectionStatus(uint256 _nftId, bool _passed) public onlyInspector {
        inspectionPassed[_nftId] = _passed;
    }


    // approve sale
    function approveSale(uint256 _nftId) public  {
     approval[_nftId][msg.sender] = true;
}

    
    receive() external payable{}


    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

// finalize sale
// -> Require inspections status (add more items, like appraisal)
// -> Require sale to be authorized
// -> Require fund to be corrected amount 
// -> transfer nft to buyer
// -> transfer fund to seller

function finalizeSale(uint256 _ntfId) public   {
    require(inspectionPassed[_ntfId]);
    require(approval[_ntfId][buyer[_ntfId]]);
    require(approval[_ntfId][seller]);
    require(approval[_ntfId][lender]);
    require(address(this).balance >= purchasePrice[_ntfId]);

    (bool success,)= payable(seller).call{value: address(this).balance}("");
    require(success);

    
    IERC721(nftAddress).transferFrom(address(this), buyer[_ntfId], _ntfId);

}

}
