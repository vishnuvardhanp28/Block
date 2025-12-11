// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CertificateRegistry
 * @dev Smart contract for issuing, verifying, and revoking blockchain-based certificates
 * @notice This contract allows authorized issuers to create tamper-proof certificates
 */
contract CertificateRegistry is Ownable {
    
    // Certificate structure containing all certificate metadata
    struct Certificate {
        bytes32 certId;           // Unique certificate identifier (hash)
        address issuer;           // Address of the issuer
        address recipient;        // Recipient wallet address (optional)
        string recipientName;     // Name of the recipient
        string course;            // Course or program name
        string grade;             // Grade or score
        uint256 issuedOn;         // Timestamp of issuance
        string ipfsCID;           // IPFS content ID (optional, for PDF storage)
        bool revoked;             // Revocation status
    }

    // Mapping from certificate ID to Certificate
    mapping(bytes32 => Certificate) private certificates;
    
    // Quick existence check for certificates
    mapping(bytes32 => bool) private exists;
    
    // Authorized issuers (addresses allowed to issue certificates)
    mapping(address => bool) public authorizedIssuer;

    // Events
    event CertificateIssued(
        bytes32 indexed certId,
        address indexed issuer,
        address indexed recipient,
        string recipientName,
        string course
    );
    
    event CertificateRevoked(
        bytes32 indexed certId,
        address indexed issuer
    );
    
    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);

    // Modifier to restrict functions to authorized issuers only
    modifier onlyIssuer() {
        require(
            authorizedIssuer[msg.sender] || owner() == msg.sender,
            "Not an authorized issuer"
        );
        _;
    }

    /**
     * @dev Constructor - sets deployer as owner and authorized issuer
     */
    constructor() Ownable(msg.sender) {
        authorizedIssuer[msg.sender] = true;
    }

    /**
     * @notice Add a new authorized issuer (owner only)
     * @param _issuer Address to authorize
     */
    function addIssuer(address _issuer) external onlyOwner {
        require(_issuer != address(0), "Invalid issuer address");
        require(!authorizedIssuer[_issuer], "Already an authorized issuer");
        
        authorizedIssuer[_issuer] = true;
        emit IssuerAdded(_issuer);
    }

    /**
     * @notice Remove an authorized issuer (owner only)
     * @param _issuer Address to remove authorization from
     */
    function removeIssuer(address _issuer) external onlyOwner {
        require(authorizedIssuer[_issuer], "Not an authorized issuer");
        require(_issuer != owner(), "Cannot remove contract owner");
        
        authorizedIssuer[_issuer] = false;
        emit IssuerRemoved(_issuer);
    }

    /**
     * @notice Issue a new certificate
     * @dev certId must be computed off-chain to ensure uniqueness
     * @param certId Unique certificate identifier
     * @param recipient Recipient wallet address
     * @param recipientName Name of the recipient
     * @param course Course or program name
     * @param grade Grade or score achieved
     * @param issuedOn Timestamp of issuance
     * @param ipfsCID IPFS content ID (optional)
     */
    function issueCertificate(
        bytes32 certId,
        address recipient,
        string calldata recipientName,
        string calldata course,
        string calldata grade,
        uint256 issuedOn,
        string calldata ipfsCID
    ) external onlyIssuer {
        require(!exists[certId], "Certificate already exists");
        require(bytes(recipientName).length > 0, "Recipient name required");
        require(bytes(course).length > 0, "Course name required");
        require(issuedOn <= block.timestamp, "Invalid issuance date");

        Certificate memory newCert = Certificate({
            certId: certId,
            issuer: msg.sender,
            recipient: recipient,
            recipientName: recipientName,
            course: course,
            grade: grade,
            issuedOn: issuedOn,
            ipfsCID: ipfsCID,
            revoked: false
        });

        certificates[certId] = newCert;
        exists[certId] = true;

        emit CertificateIssued(certId, msg.sender, recipient, recipientName, course);
    }

    /**
     * @notice Revoke an existing certificate
     * @dev Only the issuer who created the certificate or owner can revoke
     * @param certId Certificate ID to revoke
     */
    function revokeCertificate(bytes32 certId) external {
        require(exists[certId], "Certificate does not exist");
        
        Certificate storage cert = certificates[certId];
        require(
            msg.sender == cert.issuer || msg.sender == owner(),
            "Not authorized to revoke this certificate"
        );
        require(!cert.revoked, "Certificate already revoked");

        cert.revoked = true;
        emit CertificateRevoked(certId, msg.sender);
    }

    /**
     * @notice Get complete certificate details
     * @param certId Certificate ID to retrieve
     * @return All certificate fields
     */
    function getCertificate(bytes32 certId)
        external
        view
        returns (
            bytes32,
            address,
            address,
            string memory,
            string memory,
            string memory,
            uint256,
            string memory,
            bool
        )
    {
        require(exists[certId], "Certificate does not exist");
        Certificate storage cert = certificates[certId];
        
        return (
            cert.certId,
            cert.issuer,
            cert.recipient,
            cert.recipientName,
            cert.course,
            cert.grade,
            cert.issuedOn,
            cert.ipfsCID,
            cert.revoked
        );
    }

    /**
     * @notice Check if a certificate exists
     * @param certId Certificate ID to check
     * @return bool True if certificate exists
     */
    function certificateExists(bytes32 certId) external view returns (bool) {
        return exists[certId];
    }

    /**
     * @notice Check if a certificate is revoked
     * @param certId Certificate ID to check
     * @return bool True if certificate is revoked
     */
    function isRevoked(bytes32 certId) external view returns (bool) {
        require(exists[certId], "Certificate does not exist");
        return certificates[certId].revoked;
    }

    /**
     * @notice Get certificate issuer
     * @param certId Certificate ID
     * @return address Issuer address
     */
    function getIssuer(bytes32 certId) external view returns (address) {
        require(exists[certId], "Certificate does not exist");
        return certificates[certId].issuer;
    }
}
