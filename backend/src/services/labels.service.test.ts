import { LabelsService } from './labels.service';
import { DBClient } from '../config/db.client';
import { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

jest.mock('../config/db.client');
jest.mock('@aws-sdk/lib-dynamodb');

describe('LabelsService', () => {
    let service: LabelsService;
    let mockDocClient: any;

    beforeEach(() => {
        mockDocClient = {
            send: jest.fn(),
        };
        (DBClient.getInstance as jest.Mock).mockReturnValue(mockDocClient);

        jest.clearAllMocks();
        service = new LabelsService();
    });

    describe('getLabels', () => {
        it('should return labels', async () => {
            const mockLabels = [{ id: 'l1', name: 'Bug' }];
            mockDocClient.send.mockResolvedValueOnce({ Items: mockLabels });
            const result = await service.getLabels();
            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(ScanCommand));
            expect(result).toEqual(mockLabels);
        });
    });

    describe('createLabel', () => {
        it('should create a label', async () => {
            const label = { name: 'Feature' };
            await service.createLabel(label);
            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(PutCommand));
        });
    });

    describe('updateLabel', () => {
        it('should update a label', async () => {
            const label = { name: 'Updated' };
            const id = 'l1';
            const result = await service.updateLabel(id, label);
            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(PutCommand));
            expect(result.id).toBe(id);
        });
    });

    describe('deleteLabel', () => {
        it('should delete a label', async () => {
            await service.deleteLabel('l1');
            expect(mockDocClient.send).toHaveBeenCalledWith(expect.any(DeleteCommand));
        });
    });
});
