const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("CertificateRegistry", function () {
    let certificateRegistry;
    let owner;
    let issuer1;
    let issuer2;
    let recipient;
    let unauthorized;

    // Sample certificate data
    const sampleCert = {
        recipientName: "John Doe",
        course: "Blockchain Development",
        grade: "A+",
        ipfsCID: "QmExampleIPFSHash123",
    };

    beforeEach(async function () {
        // Get test accounts
        [owner, issuer1, issuer2, recipient, unauthorized] = await ethers.getSigners();

        // Deploy contract
        const CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
        certificateRegistry = await CertificateRegistry.deploy();
        await certificateRegistry.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the deployer as owner", async function () {
            expect(await certificateRegistry.owner()).to.equal(owner.address);
        });

        it("Should authorize owner as issuer by default", async function () {
            expect(await certificateRegistry.authorizedIssuer(owner.address)).to.be.true;
        });
    });

    describe("Issuer Management", function () {
        it("Should allow owner to add authorized issuer", async function () {
            await expect(certificateRegistry.addIssuer(issuer1.address))
                .to.emit(certificateRegistry, "IssuerAdded")
                .withArgs(issuer1.address);

            expect(await certificateRegistry.authorizedIssuer(issuer1.address)).to.be.true;
        });

        it("Should prevent adding zero address as issuer", async function () {
            await expect(
                certificateRegistry.addIssuer(ethers.ZeroAddress)
            ).to.be.revertedWith("Invalid issuer address");
        });

        it("Should prevent adding duplicate issuer", async function () {
            await certificateRegistry.addIssuer(issuer1.address);
            await expect(
                certificateRegistry.addIssuer(issuer1.address)
            ).to.be.revertedWith("Already an authorized issuer");
        });

        it("Should allow owner to remove authorized issuer", async function () {
            await certificateRegistry.addIssuer(issuer1.address);

            await expect(certificateRegistry.removeIssuer(issuer1.address))
                .to.emit(certificateRegistry, "IssuerRemoved")
                .withArgs(issuer1.address);

            expect(await certificateRegistry.authorizedIssuer(issuer1.address)).to.be.false;
        });

        it("Should prevent removing owner as issuer", async function () {
            await expect(
                certificateRegistry.removeIssuer(owner.address)
            ).to.be.revertedWith("Cannot remove contract owner");
        });

        it("Should prevent non-owner from managing issuers", async function () {
            await expect(
                certificateRegistry.connect(unauthorized).addIssuer(issuer1.address)
            ).to.be.revertedWithCustomError(certificateRegistry, "OwnableUnauthorizedAccount");
        });
    });

    describe("Certificate Issuance", function () {
        let certId;
        let issuedOn;

        beforeEach(async function () {
            issuedOn = await time.latest();
            // Generate certificate ID (simplified version)
            certId = ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ["address", "address", "string", "string", "uint256"],
                    [owner.address, recipient.address, sampleCert.recipientName, sampleCert.course, issuedOn]
                )
            );
        });

        it("Should allow authorized issuer to issue certificate", async function () {
            await expect(
                certificateRegistry.issueCertificate(
                    certId,
                    recipient.address,
                    sampleCert.recipientName,
                    sampleCert.course,
                    sampleCert.grade,
                    issuedOn,
                    sampleCert.ipfsCID
                )
            )
                .to.emit(certificateRegistry, "CertificateIssued")
                .withArgs(certId, owner.address, recipient.address, sampleCert.recipientName, sampleCert.course);

            expect(await certificateRegistry.certificateExists(certId)).to.be.true;
        });

        it("Should store certificate data correctly", async function () {
            await certificateRegistry.issueCertificate(
                certId,
                recipient.address,
                sampleCert.recipientName,
                sampleCert.course,
                sampleCert.grade,
                issuedOn,
                sampleCert.ipfsCID
            );

            const cert = await certificateRegistry.getCertificate(certId);
            expect(cert[0]).to.equal(certId); // certId
            expect(cert[1]).to.equal(owner.address); // issuer
            expect(cert[2]).to.equal(recipient.address); // recipient
            expect(cert[3]).to.equal(sampleCert.recipientName); // recipientName
            expect(cert[4]).to.equal(sampleCert.course); // course
            expect(cert[5]).to.equal(sampleCert.grade); // grade
            expect(cert[6]).to.equal(issuedOn); // issuedOn
            expect(cert[7]).to.equal(sampleCert.ipfsCID); // ipfsCID
            expect(cert[8]).to.equal(false); // revoked
        });

        it("Should prevent duplicate certificate issuance", async function () {
            await certificateRegistry.issueCertificate(
                certId,
                recipient.address,
                sampleCert.recipientName,
                sampleCert.course,
                sampleCert.grade,
                issuedOn,
                sampleCert.ipfsCID
            );

            await expect(
                certificateRegistry.issueCertificate(
                    certId,
                    recipient.address,
                    sampleCert.recipientName,
                    sampleCert.course,
                    sampleCert.grade,
                    issuedOn,
                    sampleCert.ipfsCID
                )
            ).to.be.revertedWith("Certificate already exists");
        });

        it("Should prevent unauthorized issuer from issuing certificate", async function () {
            await expect(
                certificateRegistry.connect(unauthorized).issueCertificate(
                    certId,
                    recipient.address,
                    sampleCert.recipientName,
                    sampleCert.course,
                    sampleCert.grade,
                    issuedOn,
                    sampleCert.ipfsCID
                )
            ).to.be.revertedWith("Not an authorized issuer");
        });

        it("Should prevent issuance with empty recipient name", async function () {
            await expect(
                certificateRegistry.issueCertificate(
                    certId,
                    recipient.address,
                    "",
                    sampleCert.course,
                    sampleCert.grade,
                    issuedOn,
                    sampleCert.ipfsCID
                )
            ).to.be.revertedWith("Recipient name required");
        });

        it("Should prevent issuance with empty course name", async function () {
            await expect(
                certificateRegistry.issueCertificate(
                    certId,
                    recipient.address,
                    sampleCert.recipientName,
                    "",
                    sampleCert.grade,
                    issuedOn,
                    sampleCert.ipfsCID
                )
            ).to.be.revertedWith("Course name required");
        });

        it("Should prevent issuance with future date", async function () {
            const futureDate = (await time.latest()) + 86400; // +1 day
            await expect(
                certificateRegistry.issueCertificate(
                    certId,
                    recipient.address,
                    sampleCert.recipientName,
                    sampleCert.course,
                    sampleCert.grade,
                    futureDate,
                    sampleCert.ipfsCID
                )
            ).to.be.revertedWith("Invalid issuance date");
        });
    });

    describe("Certificate Revocation", function () {
        let certId;
        let issuedOn;

        beforeEach(async function () {
            issuedOn = await time.latest();
            certId = ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ["address", "address", "string", "string", "uint256"],
                    [owner.address, recipient.address, sampleCert.recipientName, sampleCert.course, issuedOn]
                )
            );

            await certificateRegistry.issueCertificate(
                certId,
                recipient.address,
                sampleCert.recipientName,
                sampleCert.course,
                sampleCert.grade,
                issuedOn,
                sampleCert.ipfsCID
            );
        });

        it("Should allow issuer to revoke their certificate", async function () {
            await expect(certificateRegistry.revokeCertificate(certId))
                .to.emit(certificateRegistry, "CertificateRevoked")
                .withArgs(certId, owner.address);

            expect(await certificateRegistry.isRevoked(certId)).to.be.true;
        });

        it("Should allow owner to revoke any certificate", async function () {
            // Add issuer1 and have them issue a certificate
            await certificateRegistry.addIssuer(issuer1.address);
            const certId2 = ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ["address", "address", "string", "string", "uint256"],
                    [issuer1.address, recipient.address, "Jane Doe", "Another Course", issuedOn]
                )
            );

            await certificateRegistry.connect(issuer1).issueCertificate(
                certId2,
                recipient.address,
                "Jane Doe",
                "Another Course",
                "A",
                issuedOn,
                ""
            );

            // Owner should be able to revoke
            await expect(certificateRegistry.revokeCertificate(certId2))
                .to.emit(certificateRegistry, "CertificateRevoked")
                .withArgs(certId2, owner.address);
        });

        it("Should prevent unauthorized revocation", async function () {
            await expect(
                certificateRegistry.connect(unauthorized).revokeCertificate(certId)
            ).to.be.revertedWith("Not authorized to revoke this certificate");
        });

        it("Should prevent revoking non-existent certificate", async function () {
            const fakeCertId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
            await expect(
                certificateRegistry.revokeCertificate(fakeCertId)
            ).to.be.revertedWith("Certificate does not exist");
        });

        it("Should prevent revoking already revoked certificate", async function () {
            await certificateRegistry.revokeCertificate(certId);
            await expect(
                certificateRegistry.revokeCertificate(certId)
            ).to.be.revertedWith("Certificate already revoked");
        });
    });

    describe("Certificate Verification", function () {
        let certId;
        let issuedOn;

        beforeEach(async function () {
            issuedOn = await time.latest();
            certId = ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ["address", "address", "string", "string", "uint256"],
                    [owner.address, recipient.address, sampleCert.recipientName, sampleCert.course, issuedOn]
                )
            );

            await certificateRegistry.issueCertificate(
                certId,
                recipient.address,
                sampleCert.recipientName,
                sampleCert.course,
                sampleCert.grade,
                issuedOn,
                sampleCert.ipfsCID
            );
        });

        it("Should retrieve certificate details correctly", async function () {
            const cert = await certificateRegistry.getCertificate(certId);
            expect(cert[3]).to.equal(sampleCert.recipientName);
            expect(cert[4]).to.equal(sampleCert.course);
            expect(cert[5]).to.equal(sampleCert.grade);
        });

        it("Should check certificate existence", async function () {
            expect(await certificateRegistry.certificateExists(certId)).to.be.true;

            const fakeCertId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
            expect(await certificateRegistry.certificateExists(fakeCertId)).to.be.false;
        });

        it("Should get certificate issuer", async function () {
            expect(await certificateRegistry.getIssuer(certId)).to.equal(owner.address);
        });

        it("Should revert when getting non-existent certificate", async function () {
            const fakeCertId = ethers.keccak256(ethers.toUtf8Bytes("fake"));
            await expect(
                certificateRegistry.getCertificate(fakeCertId)
            ).to.be.revertedWith("Certificate does not exist");
        });
    });
});
